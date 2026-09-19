export interface MarkdownRun {
  text: string;
  bold: boolean;
}

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; runs: MarkdownRun[] }
  | { type: "paragraph"; runs: MarkdownRun[] }
  | { type: "listitem"; runs: MarkdownRun[] };

function parseInline(text: string): MarkdownRun[] {
  const runs: MarkdownRun[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    runs.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex), bold: false });
  }

  return runs.length > 0 ? runs : [{ text, bold: false }];
}

export function parseMarkdownLite(markdown: string): MarkdownBlock[] {
  const lines = markdown.split("\n");
  const blocks: MarkdownBlock[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({
        type: "heading",
        level,
        runs: parseInline(headingMatch[2]),
      });
      continue;
    }

    const listMatch = /^[-*]\s+(.*)$/.exec(line);
    if (listMatch) {
      blocks.push({ type: "listitem", runs: parseInline(listMatch[1]) });
      continue;
    }

    blocks.push({ type: "paragraph", runs: parseInline(line) });
  }

  return blocks;
}
