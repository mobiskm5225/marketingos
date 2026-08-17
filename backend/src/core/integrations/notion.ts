import { Client } from '@notionhq/client';
import type { Connector, SourceDocument } from './types';
import { ConnectorError } from './types';

/**
 * Reads a Notion database: every page becomes one document.
 *
 * Uses a client built from the supplied token rather than the module-level one
 * in core/notion/reader.ts, because each integration carries its own
 * credentials rather than a single process-wide key.
 */

function clientFor(token: string): Client {
  return new Client({ auth: token });
}

/** Accepts a bare id or any Notion URL containing one. */
function normaliseId(value: string): string {
  const match = value.replace(/-/g, '').match(/([0-9a-f]{32})/i);
  if (!match) throw new ConnectorError('Could not find a Notion id in that value.');
  return match[1]!;
}

function plainTextOf(richText: unknown): string {
  if (!Array.isArray(richText)) return '';
  return richText.map((rt: { plain_text?: string }) => rt.plain_text ?? '').join('');
}

function titleOf(page: { properties?: Record<string, { type?: string; title?: unknown }> }): string {
  for (const property of Object.values(page.properties ?? {})) {
    if (property?.type === 'title') {
      const text = plainTextOf(property.title);
      if (text.trim()) return text;
    }
  }
  return 'Untitled';
}

/** Walks a page's blocks, following pagination, and flattens them to text. */
async function readPage(notion: Client, pageId: string): Promise<string> {
  const lines: string[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const block of response.results as Record<string, any>[]) {
      const type = block.type as string;
      const payload = block[type];
      if (!payload) continue;

      const text = plainTextOf(payload.rich_text);
      if (!text.trim()) continue;

      // Keep enough structure that chunking has real paragraph boundaries.
      if (type === 'heading_1') lines.push(`\n# ${text}`);
      else if (type === 'heading_2') lines.push(`\n## ${text}`);
      else if (type === 'heading_3') lines.push(`\n### ${text}`);
      else if (type === 'bulleted_list_item') lines.push(`- ${text}`);
      else if (type === 'numbered_list_item') lines.push(`1. ${text}`);
      else if (type === 'code') lines.push(`\n\`\`\`\n${text}\n\`\`\``);
      else lines.push(`\n${text}`);
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return lines.join('\n').trim();
}

export const notionConnector: Connector = {
  slug: 'notion',
  fields: [
    {
      key: 'token',
      label: 'Internal integration token',
      type: 'password',
      placeholder: 'ntn_… or secret_…',
      required: true,
      secret: true,
      help: 'Create one at notion.so/my-integrations, then share the database with it.',
    },
    {
      key: 'databaseId',
      label: 'Database ID or URL',
      type: 'text',
      placeholder: 'https://notion.so/workspace/abc123…',
      required: true,
      help: 'Paste the database URL — the id is extracted automatically.',
    },
  ],

  async connect(input) {
    const notion = clientFor(input.token!);
    const databaseId = normaliseId(input.databaseId ?? '');

    try {
      const database = (await notion.databases.retrieve({
        database_id: databaseId,
      })) as { title?: unknown };
      const name = plainTextOf(database.title) || 'Untitled database';

      const probe = await notion.dataSources.query({
        data_source_id: databaseId,
        page_size: 1,
      });

      return {
        detail: `Connected · ${name}`,
        config: { databaseId, databaseName: name, hasPages: probe.results.length > 0 },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // The overwhelmingly common cause, and the message Notion gives is opaque.
      if (message.includes('object_not_found') || message.includes('Could not find')) {
        throw new ConnectorError(
          'Notion cannot see that database. Open it, click ··· → Connections, and add your integration.',
        );
      }
      if (message.includes('unauthorized') || message.includes('API token is invalid')) {
        throw new ConnectorError('That integration token was rejected by Notion.');
      }
      throw new ConnectorError(message);
    }
  },

  async list(input) {
    const notion = clientFor(input.token!);
    const databaseId = normaliseId(input.databaseId ?? '');
    const documents: SourceDocument[] = [];
    let cursor: string | undefined;

    do {
      const response = await notion.dataSources.query({
        data_source_id: databaseId,
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });

      for (const page of response.results as Record<string, any>[]) {
        if (page.object !== 'page' || page.archived || page.in_trash) continue;
        const text = await readPage(notion, page.id);
        if (!text.trim()) continue;
        documents.push({
          externalId: page.id,
          name: titleOf(page),
          text,
          mimeType: 'text/markdown',
          url: page.url ?? null,
        });
      }

      cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
    } while (cursor);

    return documents;
  },
};
