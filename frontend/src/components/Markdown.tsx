import { Fragment, type ReactNode } from "react";

/**
 * A small markdown renderer for skill documents.
 *
 * It builds React elements directly rather than setting innerHTML, so a skill
 * containing raw HTML or a script tag renders as text and cannot execute. That
 * also keeps it safe under SSR, where a DOM-based sanitiser would need jsdom.
 *
 * Covers what SKILL.md files actually use: headings, ordered and unordered
 * lists, fenced code, blockquotes, tables, horizontal rules, and inline
 * bold/italic/code/links.
 */
export function Markdown({ source }: { source: string }) {
  return <div className="md space-y-3 text-sm">{renderBlocks(source)}</div>;
}

function renderBlocks(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Fenced code
    if (line.trimStart().startsWith("```")) {
      const fence: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i]!.trimStart().startsWith("```")) {
        fence.push(lines[i]!);
        i += 1;
      }
      i += 1; // closing fence
      out.push(
        <pre
          key={key++}
          className="overflow-x-auto rounded-md border border-border bg-secondary/40 p-3 font-mono text-xs"
        >
          <code>{fence.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1]!.length;
      const text = heading[2]!;
      const sizes = [
        "text-xl font-semibold",
        "text-lg font-semibold",
        "text-base font-semibold",
        "text-sm font-semibold",
        "text-sm font-medium",
        "text-xs font-medium uppercase tracking-widest text-muted-foreground",
      ];
      out.push(
        <p key={key++} className={`${sizes[level - 1]} mt-4`}>
          {inline(text)}
        </p>,
      );
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      out.push(<hr key={key++} className="border-border" />);
      i += 1;
      continue;
    }

    // Table — a header row followed by a separator row
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1]!)) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.includes("|")) {
        rows.push(splitRow(lines[i]!));
        i += 1;
      }
      out.push(
        <div key={key++} className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                {header.map((cell, n) => (
                  <th key={n} className="border-b border-border px-2 py-1.5 font-medium">
                    {inline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="border-b border-border/50 px-2 py-1.5 align-top">
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i]!.startsWith(">")) {
        quote.push(lines[i]!.replace(/^>\s?/, ""));
        i += 1;
      }
      out.push(
        <blockquote
          key={key++}
          className="border-l-2 border-primary/60 pl-3 text-muted-foreground"
        >
          {inline(quote.join(" "))}
        </blockquote>,
      );
      continue;
    }

    // Lists — accumulate items so they land inside a single <ul>/<ol>
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const items: string[] = [];
      while (i < lines.length) {
        const m = ordered
          ? lines[i]!.match(/^\s*\d+[.)]\s+(.*)$/)
          : lines[i]!.match(/^\s*[-*+]\s+(.*)$/);
        if (!m) break;
        items.push(m[1]!);
        i += 1;
      }
      const ListTag = ordered ? "ol" : "ul";
      out.push(
        <ListTag
          key={key++}
          className={`space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"} marker:text-muted-foreground`}
        >
          {items.map((item, n) => (
            <li key={n}>{inline(item)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Paragraph — join until a blank line or the start of another block
    const para: string[] = [];
    while (i < lines.length && lines[i]!.trim() !== "" && !isBlockStart(lines[i]!)) {
      para.push(lines[i]!);
      i += 1;
    }
    out.push(
      <p key={key++} className="text-muted-foreground">
        {inline(para.join(" "))}
      </p>,
    );
  }

  return out;
}

function isBlockStart(line: string): boolean {
  return (
    /^#{1,6}\s/.test(line) ||
    line.trimStart().startsWith("```") ||
    line.startsWith(">") ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line)
  );
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
}

/** Inline spans: `code`, **bold**, *italic*, [text](url). */
function inline(text: string): ReactNode {
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern).filter((p) => p !== undefined && p !== "");

  return parts.map((part, n) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={n} className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={n} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={n}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2]!;
      // Only http(s) — a javascript: URL must never become a live link.
      const safe = /^https?:\/\//i.test(href);
      return safe ? (
        <a
          key={n}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary underline underline-offset-2"
        >
          {link[1]}
        </a>
      ) : (
        <Fragment key={n}>{link[1]}</Fragment>
      );
    }
    return <Fragment key={n}>{part}</Fragment>;
  });
}
