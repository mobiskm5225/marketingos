import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export function extractNotionPageId(url: string): string {
  const cleaned = url.replace(/-/g, '');
  const match = cleaned.match(/([0-9a-f]{32})/i);
  return match ? match[1] : '';
}

export async function getPageContent(pageId: string): Promise<string> {
  const parts: string[] = [];
  let cursor: string | undefined;

  while (true) {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const block of response.results as any[]) {
      const type = block.type as string;
      if (block[type]?.rich_text) {
        for (const rt of block[type].rich_text) {
          if (rt.plain_text) parts.push(rt.plain_text);
        }
      }
    }

    if (!response.has_more) break;
    cursor = response.next_cursor ?? undefined;
  }

  return parts.join('\n');
}

export async function getPageProperties(pageId: string): Promise<{ blogUrl: string; title: string }> {
  const page = await notion.pages.retrieve({ page_id: pageId }) as any;
  const props = page.properties ?? {};
  let blogUrl = '';
  if (props['Blog URL']?.type === 'url') {
    blogUrl = props['Blog URL'].url ?? '';
  }
  return { blogUrl, title: titleFromPage(page) };
}

// Title property can be named anything ("title", "Name", "Title", ...) —
// find it by type, not by name.
export function titleFromPage(page: any): string {
  const props = page?.properties ?? {};
  for (const prop of Object.values(props) as any[]) {
    if (prop?.type === 'title') {
      return (prop.title ?? []).map((t: any) => t.plain_text ?? '').join('').trim();
    }
  }
  return '';
}

export async function getPageTitle(pageId: string): Promise<string> {
  const page = await notion.pages.retrieve({ page_id: pageId }) as any;
  return titleFromPage(page);
}

export async function retrievePage(pageId: string): Promise<any> {
  return notion.pages.retrieve({ page_id: pageId });
}

// Direct child pages of a page/block (e.g. a blog draft nested under a
// Blog Tracker row). Follows pagination.
export async function listChildPages(blockId: string): Promise<{ id: string; title: string }[]> {
  const out: { id: string; title: string }[] = [];
  let cursor: string | undefined;

  while (true) {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    for (const block of response.results as any[]) {
      if (block.type === 'child_page') {
        out.push({ id: block.id, title: block.child_page?.title ?? '' });
      }
    }
    if (!response.has_more) break;
    cursor = response.next_cursor ?? undefined;
  }

  return out;
}

export async function queryDatabase(
  databaseId: string,
  filter: object
): Promise<any[]> {
  const token = process.env.NOTION_API_KEY;
  const url = `https://api.notion.com/v1/databases/${databaseId}/query`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filter }),
  });
  const data = await resp.json() as any;
  return data.results ?? [];
}

// Fetch every page in a database, following pagination.
export async function queryDatabaseAll(databaseId: string): Promise<any[]> {
  const token = process.env.NOTION_API_KEY;
  const url = `https://api.notion.com/v1/databases/${databaseId}/query`;
  const results: any[] = [];
  let cursor: string | undefined;

  while (true) {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Notion query failed (${resp.status}): ${body.slice(0, 200)}`);
    }
    const data = await resp.json() as any;
    results.push(...(data.results ?? []));
    if (!data.has_more) break;
    cursor = data.next_cursor ?? undefined;
  }

  return results;
}
