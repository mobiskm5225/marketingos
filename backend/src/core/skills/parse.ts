import matter from 'gray-matter';

export interface ParsedDoc {
  /** The YAML frontmatter block, if any. */
  frontmatter: Record<string, unknown>;
  /** Everything after the frontmatter. */
  body: string;
  /** The whole file, unchanged — this is what gets stored as `body_md`. */
  raw: string;
  name: string;
  description: string;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/**
 * Parses a SKILL.md or AGENT.md.
 *
 * The full file is preserved as `raw` and stored verbatim, so a skill
 * round-trips with the user's existing corpus and with git. Frontmatter is
 * mirrored into columns only so the library is searchable without reparsing.
 *
 * `fallbackName` is used when a file has no frontmatter `name` — the directory
 * name is the convention in the folder layout (`skills/<name>/SKILL.md`).
 */
export function parseDoc(raw: string, fallbackName = ''): ParsedDoc {
  let frontmatter: Record<string, unknown> = {};
  let body = raw;

  try {
    const parsed = matter(raw);
    frontmatter = (parsed.data ?? {}) as Record<string, unknown>;
    body = parsed.content;
  } catch {
    // Malformed YAML shouldn't lose the document — treat it as body-only.
    frontmatter = {};
    body = raw;
  }

  const name =
    typeof frontmatter.name === 'string' && frontmatter.name.trim()
      ? frontmatter.name.trim()
      : firstHeading(body) || fallbackName;

  const description =
    typeof frontmatter.description === 'string' ? frontmatter.description.trim() : '';

  return { frontmatter, body, raw, name, description };
}

function firstHeading(body: string): string {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1]!.trim() : '';
}
