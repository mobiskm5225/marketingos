import fs from 'node:fs/promises';
import path from 'node:path';
import type { Connector, SourceDocument } from './types';
import { ConnectorError } from './types';

/**
 * Indexes markdown from a local Obsidian vault.
 *
 * The backend usually runs in a container, so the vault has to be mounted in
 * before it is visible. OBSIDIAN_VAULT_ROOT names the mount point, and every
 * path supplied by a user is resolved inside it — a vault path is user input,
 * so "../.." must not be able to walk out to the rest of the filesystem.
 */

const VAULT_ROOT = process.env.OBSIDIAN_VAULT_ROOT ?? '/vaults';
const MAX_FILES = 2000;
const MAX_FILE_BYTES = 1_000_000;

/** Resolves a user-supplied path inside the mount and refuses escapes. */
function resolveInsideRoot(vaultPath: string): string {
  const root = path.resolve(VAULT_ROOT);
  const target = path.resolve(root, vaultPath.replace(/^\/+/, ''));
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new ConnectorError(`Vault path must stay inside ${root}.`);
  }
  return target;
}

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  if (acc.length >= MAX_FILES) return acc;
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (acc.length >= MAX_FILES) break;
    // Obsidian's own metadata folder holds no note content.
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, acc);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) acc.push(full);
  }

  return acc;
}

export const obsidianConnector: Connector = {
  slug: 'obsidian',
  fields: [
    {
      key: 'vaultPath',
      label: 'Vault folder',
      type: 'text',
      placeholder: 'marketing',
      required: true,
      help: `Relative to ${VAULT_ROOT}. Mount your vault there in docker-compose.yml first.`,
    },
  ],

  async connect(input) {
    const target = resolveInsideRoot(input.vaultPath ?? '');

    let stat;
    try {
      stat = await fs.stat(target);
    } catch {
      throw new ConnectorError(
        `Nothing at ${target}. Mount the vault into the backend container — see docker-compose.yml.`,
      );
    }
    if (!stat.isDirectory()) throw new ConnectorError(`${target} is not a folder.`);

    const files = await walk(target);
    if (files.length === 0) throw new ConnectorError('No .md files found in that folder.');

    return {
      detail: `Connected · ${files.length} notes`,
      config: { vaultPath: input.vaultPath, noteCount: files.length },
    };
  },

  async list(input) {
    const target = resolveInsideRoot(input.vaultPath ?? '');
    const files = await walk(target);
    const documents: SourceDocument[] = [];

    for (const file of files) {
      const stat = await fs.stat(file);
      if (stat.size > MAX_FILE_BYTES) continue;
      const text = await fs.readFile(file, 'utf8');
      if (!text.trim()) continue;
      const relative = path.relative(target, file);
      documents.push({
        externalId: relative,
        name: relative.replace(/\.md$/i, ''),
        text,
        mimeType: 'text/markdown',
      });
    }

    return documents;
  },
};
