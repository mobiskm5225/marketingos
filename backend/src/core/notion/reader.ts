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

export async function getPageProperties(pageId: string): Promise<{ blogUrl: string }> {
  const page = await notion.pages.retrieve({ page_id: pageId }) as any;
  const props = page.properties ?? {};
  let blogUrl = '';
  if (props['Blog URL']?.type === 'url') {
    blogUrl = props['Blog URL'].url ?? '';
  }
  return { blogUrl };
}

export async function getPageTitle(pageId: string): Promise<string> {
  const page = await notion.pages.retrieve({ page_id: pageId }) as any;
  const titleParts = page.properties?.title?.title ?? [];
  return titleParts.map((t: any) => t.plain_text ?? '').join('').trim();
}

export async function retrievePage(pageId: string): Promise<any> {
  return notion.pages.retrieve({ page_id: pageId });
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
