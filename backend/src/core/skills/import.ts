import AdmZip from 'adm-zip';
import { parseDoc, slugify } from './parse';
import { analyzePipeline, type AnalyzedStage } from './analyze';
import { HttpError } from '../../middleware/error';

/**
 * Both import paths (an uploaded folder and a GitHub URL) reduce to the same
 * thing — a flat map of relative path → file contents — and then run through one
 * parser. Nothing is written to the database here: an import returns a preview
 * the user confirms in the pipeline map first.
 */
export type FileMap = Map<string, string>;

export interface ImportPreview {
  agent: {
    slug: string;
    name: string;
    description: string;
    agentMd: string | null;
    guardrails: string | null;
    /** True when no AGENT.md was found and we synthesised one. */
    generated: boolean;
  };
  skills: {
    slug: string;
    name: string;
    description: string;
    bodyMd: string;
    frontmatter: Record<string, unknown>;
  }[];
  references: { name: string; bodyMd: string }[];
  stages: AnalyzedStage[];
  warnings: string[];
}

const MAX_FILES = 500;
const MAX_FILE_BYTES = 1_000_000;

/** `skills/gather-context/SKILL.md` → `gather-context` */
function skillDirName(path: string): string | null {
  const match = path.match(/(?:^|\/)skills\/([^/]+)\/SKILL\.md$/i);
  return match ? match[1]! : null;
}

function isAgentMd(path: string): boolean {
  return /(?:^|\/)AGENT\.md$/i.test(path);
}

function isReference(path: string): boolean {
  return /(?:^|\/)references\/[^/]+\.md$/i.test(path);
}

function baseName(path: string): string {
  return path.split('/').pop() ?? path;
}

/**
 * Extracts the "What this agent CANNOT do" section, which these agents use to
 * state negative constraints. Carried into every prompt as guardrails.
 */
function extractGuardrails(agentMd: string): string | null {
  const match = agentMd.match(/##\s*What this agent CANNOT do\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  return match ? match[1]!.trim() : null;
}

export function buildPreview(files: FileMap, sourceRef: string): ImportPreview {
  const warnings: string[] = [];

  // ── Skills ────────────────────────────────────────────────────────────────
  const skills: ImportPreview['skills'] = [];
  for (const [path, content] of files) {
    const dir = skillDirName(path);
    if (!dir) continue;
    const parsed = parseDoc(content, dir);
    skills.push({
      slug: slugify(typeof parsed.frontmatter.name === 'string' ? parsed.frontmatter.name : dir),
      name: parsed.name || dir,
      description: parsed.description,
      bodyMd: parsed.raw,
      frontmatter: parsed.frontmatter,
    });
  }

  if (skills.length === 0) {
    throw new HttpError(
      400,
      'No skills found. Expected at least one file at skills/<name>/SKILL.md.',
    );
  }

  // ── References ────────────────────────────────────────────────────────────
  const references: ImportPreview['references'] = [];
  for (const [path, content] of files) {
    if (!isReference(path)) continue;
    references.push({ name: baseName(path).replace(/\.md$/i, ''), bodyMd: content });
  }

  // ── Parent agent ──────────────────────────────────────────────────────────
  let agentMd: string | null = null;
  for (const [path, content] of files) {
    if (isAgentMd(path)) {
      agentMd = content;
      break;
    }
  }

  let generated = false;
  let agentName = '';
  let agentDescription = '';

  if (agentMd) {
    const parsed = parseDoc(agentMd);
    agentName = parsed.name;
    agentDescription = parsed.description;
  } else {
    // The user asked that a folder of skills still produce a parent agent.
    generated = true;
    agentName = inferAgentName(files) || 'Imported agent';
    agentDescription = `Imported from ${sourceRef}. Runs ${skills.length} skills in sequence.`;
    agentMd = synthesiseAgentMd(agentName, agentDescription, skills);
    warnings.push(
      'No AGENT.md found — a parent agent was generated and its stages run sequentially. Review the pipeline before saving.',
    );
  }

  const stages = analyzePipeline(
    agentMd,
    skills.map((s) => s.slug),
  );

  const unwired = stages.filter((s) => s.position !== 1 && s.dependsOn.length === 0);
  if (unwired.length > 0) {
    warnings.push(
      `Could not infer dependencies for: ${unwired.map((s) => s.skillSlug).join(', ')}. Wire them in the pipeline map.`,
    );
  }

  if (references.length === 0) {
    warnings.push('No references/*.md found — this agent will run without always-in-prompt docs.');
  }

  return {
    agent: {
      slug: slugify(agentName),
      name: agentName,
      description: agentDescription,
      agentMd,
      guardrails: extractGuardrails(agentMd),
      generated,
    },
    skills,
    references,
    stages,
    warnings,
  };
}

/** Uses the common top-level folder name, e.g. `website-pages-content/…`. */
function inferAgentName(files: FileMap): string {
  const tops = new Set<string>();
  for (const path of files.keys()) {
    const [top] = path.split('/');
    if (top && top !== 'skills' && top !== 'references') tops.add(top);
  }
  return tops.size === 1 ? [...tops][0]! : '';
}

function synthesiseAgentMd(
  name: string,
  description: string,
  skills: ImportPreview['skills'],
): string {
  const pipeline = skills.map((s, i) => `${i + 1}. ${s.slug}`).join('\n');
  return `---
name: ${name}
description: ${description}
---

# ${name}

Generated on import because no AGENT.md was supplied. Review the pipeline below.

## Pipeline

\`\`\`
${pipeline}
\`\`\`
`;
}

// ─── Source: uploaded zip ──────────────────────────────────────────────────────

export function filesFromZip(buffer: Buffer): FileMap {
  const files: FileMap = new Map();
  let zip: AdmZip;

  try {
    zip = new AdmZip(buffer);
  } catch {
    throw new HttpError(400, 'Could not read the uploaded file as a zip archive.');
  }

  const entries = zip.getEntries();
  if (entries.length > MAX_FILES) {
    throw new HttpError(400, `Archive has too many files (limit ${MAX_FILES}).`);
  }

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    if (!/\.md$/i.test(entry.entryName)) continue;

    // Reject path traversal — entry names come from an untrusted archive.
    if (entry.entryName.includes('..') || entry.entryName.startsWith('/')) continue;
    if (entry.header.size > MAX_FILE_BYTES) continue;

    files.set(normalisePath(entry.entryName), entry.getData().toString('utf8'));
  }

  if (files.size === 0) throw new HttpError(400, 'Archive contains no .md files.');
  return files;
}

/** Drops a single wrapping folder so `repo-main/skills/x` matches `skills/x`. */
function normalisePath(path: string): string {
  return path.replace(/^\.\//, '');
}

// ─── Source: GitHub ────────────────────────────────────────────────────────────

interface GithubTarget {
  owner: string;
  repo: string;
  ref: string;
  subPath: string;
}

export function parseGithubUrl(url: string): GithubTarget {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new HttpError(400, 'Not a valid URL.');
  }

  if (parsed.hostname !== 'github.com' && parsed.hostname !== 'www.github.com') {
    throw new HttpError(400, 'Only github.com URLs are supported.');
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length < 2) throw new HttpError(400, 'URL must include an owner and repository.');

  const [owner, repo, kind, ref, ...rest] = parts;
  return {
    owner: owner!,
    repo: repo!.replace(/\.git$/, ''),
    // /tree/<branch>/<path> and /blob/<branch>/<path> both appear in the wild.
    ref: (kind === 'tree' || kind === 'blob') && ref ? ref : 'HEAD',
    subPath: (kind === 'tree' || kind === 'blob') && rest.length > 0 ? rest.join('/') : '',
  };
}

export async function filesFromGithub(url: string): Promise<{ files: FileMap; ref: string }> {
  const { owner, repo, ref, subPath } = parseGithubUrl(url);

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'marketing-os',
  };
  // Unauthenticated GitHub allows 60 requests/hour; a token raises it to 5,000.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers, signal: AbortSignal.timeout(20_000) });

  if (treeRes.status === 404) throw new HttpError(404, 'Repository or branch not found.');
  if (treeRes.status === 403) {
    throw new HttpError(429, 'GitHub rate limit reached. Set GITHUB_TOKEN and retry.');
  }
  if (!treeRes.ok) throw new HttpError(502, `GitHub returned ${treeRes.status}.`);

  const tree = (await treeRes.json()) as {
    tree?: { path: string; type: string; size?: number }[];
    truncated?: boolean;
  };

  const wanted = (tree.tree ?? []).filter(
    (n) =>
      n.type === 'blob' &&
      /\.md$/i.test(n.path) &&
      (subPath === '' || n.path === subPath || n.path.startsWith(`${subPath}/`)) &&
      (n.size ?? 0) <= MAX_FILE_BYTES,
  );

  if (wanted.length === 0) throw new HttpError(404, 'No .md files found at that path.');
  if (wanted.length > MAX_FILES) {
    throw new HttpError(400, `That path has too many files (limit ${MAX_FILES}).`);
  }

  const files: FileMap = new Map();
  // Fetch in small batches so a big skills folder doesn't open 100 sockets.
  for (let i = 0; i < wanted.length; i += 10) {
    const batch = wanted.slice(i, i + 10);
    await Promise.all(
      batch.map(async (node) => {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${node.path}`;
        const res = await fetch(rawUrl, {
          headers: { 'User-Agent': 'marketing-os' },
          signal: AbortSignal.timeout(20_000),
        });
        if (!res.ok) return;
        // Store paths relative to the requested subdirectory.
        const relative = subPath ? node.path.slice(subPath.length).replace(/^\//, '') : node.path;
        files.set(relative, await res.text());
      }),
    );
  }

  if (files.size === 0) throw new HttpError(502, 'Could not download any files from GitHub.');
  return { files, ref: `${owner}/${repo}${subPath ? `/${subPath}` : ''}` };
}
