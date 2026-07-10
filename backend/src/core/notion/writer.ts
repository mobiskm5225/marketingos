import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const MAX_BLOCK_TEXT = 2000;
const MAX_BLOCKS_PER_REQUEST = 100;

function richText(content: string): object[] {
  // Parse bold (**text**) and inline code (`code`) into rich text segments
  const segments: object[] = [];
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', text: { content: content.slice(last, match.index) } });
    }
    if (match[2]) {
      segments.push({ type: 'text', text: { content: match[2] }, annotations: { bold: true } });
    } else if (match[3]) {
      segments.push({ type: 'text', text: { content: match[3] }, annotations: { code: true } });
    }
    last = match.index + match[0].length;
  }
  if (last < content.length) {
    segments.push({ type: 'text', text: { content: content.slice(last) } });
  }
  return segments.length ? segments : [{ type: 'text', text: { content } }];
}

function heading(level: 1 | 2 | 3, content: string): object {
  const key = `heading_${level}`;
  return { object: 'block', type: key, [key]: { rich_text: richText(content) } };
}

function bullet(content: string): object {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: richText(content.slice(0, MAX_BLOCK_TEXT)) },
  };
}

function numbered(content: string): object {
  return {
    object: 'block',
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: richText(content.slice(0, MAX_BLOCK_TEXT)) },
  };
}

function todo(content: string, checked: boolean): object {
  return {
    object: 'block',
    type: 'to_do',
    to_do: { rich_text: richText(content.slice(0, MAX_BLOCK_TEXT)), checked },
  };
}

function callout(content: string, emoji: string, color: string): object {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: richText(content.slice(0, MAX_BLOCK_TEXT)),
      icon: { type: 'emoji', emoji },
      color,
    },
  };
}

function code(content: string, language = 'json'): object {
  return {
    object: 'block',
    type: 'code',
    code: {
      rich_text: [{ type: 'text', text: { content: content.slice(0, 2000) } }],
      language,
    },
  };
}

function paragraph(content: string): object {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: { rich_text: richText(content.slice(0, MAX_BLOCK_TEXT)) },
  };
}

function divider(): object {
  return { object: 'block', type: 'divider', divider: {} };
}

// Detect severity callout headers
function severityCallout(s: string): object | null {
  if (s.startsWith('### 🔴')) return callout(s.replace(/^###\s*/, ''), '🔴', 'red_background');
  if (s.startsWith('### 🟡')) return callout(s.replace(/^###\s*/, ''), '🟡', 'yellow_background');
  if (s.startsWith('### 🔵')) return callout(s.replace(/^###\s*/, ''), '🔵', 'blue_background');
  if (s.startsWith('### 🟢')) return callout(s.replace(/^###\s*/, ''), '🟢', 'green_background');
  return null;
}

export function markdownToBlocks(text: string): object[] {
  const blocks: object[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const s = raw.trim();

    // Code block (```lang ... ```)
    if (s.startsWith('```')) {
      const lang = s.slice(3).trim() || 'plain text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(code(codeLines.join('\n'), lang === 'json' ? 'json' : 'plain text'));
      i++;
      continue;
    }

    if (!s) { i++; continue; }

    // Severity-coloured callout headings
    const sc = severityCallout(s);
    if (sc) { blocks.push(sc); i++; continue; }

    // Headings
    if (s.startsWith('### ')) { blocks.push(heading(3, s.slice(4))); i++; continue; }
    if (s.startsWith('## '))  { blocks.push(heading(2, s.slice(3))); i++; continue; }
    if (s.startsWith('# '))   { blocks.push(heading(1, s.slice(2))); i++; continue; }

    // To-do checkboxes
    if (s.startsWith('- [ ] ')) { blocks.push(todo(s.slice(6), false)); i++; continue; }
    if (s.startsWith('- [x] ')) { blocks.push(todo(s.slice(6), true));  i++; continue; }

    // Bullets
    if (s.startsWith('- ') || s.startsWith('* ')) { blocks.push(bullet(s.slice(2))); i++; continue; }

    // Numbered lists (1. 2. etc.)
    if (/^\d+\.\s/.test(s)) { blocks.push(numbered(s.replace(/^\d+\.\s/, ''))); i++; continue; }

    // Table rows — skip the separator row, render data rows as bullets
    if (s.startsWith('|')) {
      if (s.replace(/[\|\s\-:]/g, '').length === 0) { i++; continue; } // separator
      const cells = s.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length) blocks.push(bullet(cells.join('  ·  ')));
      i++;
      continue;
    }

    // Divider
    if (s.startsWith('---')) { blocks.push(divider()); i++; continue; }

    // Quote / blockquote
    if (s.startsWith('> ')) { blocks.push(callout(s.slice(2), '💡', 'gray_background')); i++; continue; }

    // Default paragraph
    blocks.push(paragraph(s));
    i++;
  }

  return blocks;
}

async function appendBlocksChunked(blockId: string, blocks: object[]): Promise<void> {
  for (let i = MAX_BLOCKS_PER_REQUEST; i < blocks.length; i += MAX_BLOCKS_PER_REQUEST) {
    await notion.blocks.children.append({
      block_id: blockId,
      children: blocks.slice(i, i + MAX_BLOCKS_PER_REQUEST) as any,
    });
  }
}

export async function createSubpage(
  parentPageId: string,
  title: string,
  content: string
): Promise<any> {
  const blocks = markdownToBlocks(content);
  const page = await notion.pages.create({
    parent: { page_id: parentPageId },
    properties: { title: { title: [{ text: { content: title } }] } },
    children: blocks.slice(0, MAX_BLOCKS_PER_REQUEST) as any,
  });
  await appendBlocksChunked(page.id, blocks);
  return page;
}

export async function archivePage(pageId: string): Promise<void> {
  await notion.pages.update({ page_id: pageId, archived: true });
}

// Create a subpage, replacing any previous subpage with the same title under
// the same parent. Old versions are archived (recoverable from Notion trash) —
// the parent only ever shows one current copy.
export async function replaceSubpage(
  parentPageId: string,
  title: string,
  content: string
): Promise<any> {
  let cursor: string | undefined;
  while (true) {
    const response = await notion.blocks.children.list({
      block_id: parentPageId,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    for (const block of response.results as any[]) {
      if (block.type === 'child_page' && block.child_page?.title === title) {
        await archivePage(block.id);
      }
    }
    if (!response.has_more) break;
    cursor = response.next_cursor ?? undefined;
  }
  return createSubpage(parentPageId, title, content);
}

export async function createDatabaseEntry(
  databaseId: string,
  title: string,
  content: string,
  statusProp: string,
  statusValue: string = 'Pending'
): Promise<any> {
  const blocks = markdownToBlocks(content);
  const page = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      [statusProp]: { select: { name: statusValue } },
    },
    children: blocks.slice(0, MAX_BLOCKS_PER_REQUEST) as any,
  });
  await appendBlocksChunked(page.id, blocks);
  return page;
}

export async function updateStatus(
  pageId: string,
  propName: string,
  value: string
): Promise<void> {
  await notion.pages.update({
    page_id: pageId,
    properties: { [propName]: { select: { name: value } } },
  });
}
