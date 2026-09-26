import { parseMarkdownLite } from "@/lib/markdown-lite";
import type { CaseResponseItem } from "@/types/insafdost";

const PAGE_MARGIN = 15;
const LINE_HEIGHT = 6;

function sanitizeFilename(input: string): string {
  return (
    input
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/-+/g, "-")
      .slice(0, 60)
      .replace(/^-|-$/g, "") || "analysis"
  );
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function copyFindingsToClipboard(
  result: CaseResponseItem,
): Promise<void> {
  const text = [
    "InsafDost AI — Legal Analysis",
    `Matter ${result._case_num} | ${result.category} | Audit ${Math.round(result.audit_score * 100)}%`,
    "",
    "Scenario:",
    result.raw_text || "No scenario text available.",
    "",
    "Findings:",
    result.final_answer.replace(/\\n/g, "\n").trim(),
  ].join("\n");

  return navigator.clipboard.writeText(text);
}

export function copyCitationToClipboard(source: string): Promise<void> {
  return navigator.clipboard.writeText(source);
}

export async function exportCaseAsPdf(
  result: CaseResponseItem,
): Promise<void> {
  // Lazy-load jsPDF to reduce initial bundle size by ~350KB.
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  function writeBlock(
    text: string,
    options: { size: number; bold: boolean; spacingAfter: number },
  ) {
    doc.setFontSize(options.size);
    doc.setFont("helvetica", options.bold ? "bold" : "normal");
    const wrapped = doc.splitTextToSize(text, contentWidth) as string[];

    for (const line of wrapped) {
      if (y + LINE_HEIGHT > pageHeight - PAGE_MARGIN) {
        doc.addPage();
        y = PAGE_MARGIN;
      }
      doc.text(line, PAGE_MARGIN, y);
      y += LINE_HEIGHT;
    }
    y += options.spacingAfter;
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("InsafDost AI — Legal Analysis", PAGE_MARGIN, y);
  y += 10;

  writeBlock(
    `Matter ${result._case_num}  |  Category: ${result.category}  |  Audit Score: ${Math.round(result.audit_score * 100)}%`,
    { size: 10, bold: false, spacingAfter: 6 },
  );

  writeBlock("Scenario", { size: 12, bold: true, spacingAfter: 2 });
  writeBlock(result.raw_text || "No scenario text available.", {
    size: 10,
    bold: false,
    spacingAfter: 6,
  });

  writeBlock("Findings", { size: 12, bold: true, spacingAfter: 2 });
  const cleanAnswer = (result.final_answer || "")
    .replace(/\\n/g, "\n")
    .trim();

  for (const block of parseMarkdownLite(cleanAnswer)) {
    const text = block.runs.map((run) => run.text).join("");
    const prefix = block.type === "listitem" ? "•  " : "";
    writeBlock(prefix + text, {
      size: block.type === "heading" ? 11 : 10,
      bold: block.type === "heading" || block.runs.some((run) => run.bold),
      spacingAfter: block.type === "paragraph" ? 3 : 1,
    });
  }

  if (result.precedents.length > 0) {
    y += 3;
    writeBlock("Referenced Authorities", {
      size: 12,
      bold: true,
      spacingAfter: 2,
    });

    result.precedents.forEach((precedent, index) => {
      const source =
        result.precedent_meta[index]?.source ?? `Authority ${index + 1}`;
      writeBlock(source, { size: 10, bold: true, spacingAfter: 1 });
      writeBlock(precedent.replace(/\\n/g, " ").trim(), {
        size: 9,
        bold: false,
        spacingAfter: 4,
      });
    });
  }

  doc.save(
    `insafdost-matter-${result._case_num}-${sanitizeFilename(result.category)}.pdf`,
  );
}

export async function exportCaseAsDocx(
  result: CaseResponseItem,
): Promise<void> {
  // Lazy-load docx to reduce initial bundle size by ~450KB.
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import(
    "docx"
  );

  const cleanAnswer = (result.final_answer || "")
    .replace(/\\n/g, "\n")
    .trim();

  const findingParagraphs = parseMarkdownLite(cleanAnswer).map(
    (block) => {
      const runs = block.runs.map(
        (run) =>
          new TextRun({
            text: run.text,
            bold: run.bold || block.type === "heading",
          }),
      );

      if (block.type === "heading") {
        return new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: runs,
          spacing: { before: 200, after: 100 },
        });
      }

      if (block.type === "listitem") {
        return new Paragraph({
          bullet: { level: 0 },
          children: runs,
          spacing: { after: 80 },
        });
      }

      return new Paragraph({ children: runs, spacing: { after: 120 } });
    },
  );

  const precedentParagraphs = result.precedents.flatMap((precedent, index) => {
    const source =
      result.precedent_meta[index]?.source ?? `Authority ${index + 1}`;

    return [
      new Paragraph({
        children: [new TextRun({ text: source, bold: true })],
        spacing: { before: 160, after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: precedent.replace(/\\n/g, " ").trim() }),
        ],
        spacing: { after: 100 },
      }),
    ];
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "InsafDost AI — Legal Analysis" })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Matter ${result._case_num}  |  Category: ${result.category}  |  Audit Score: ${Math.round(result.audit_score * 100)}%`,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Scenario" })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: result.raw_text || "No scenario text available.",
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Findings" })],
          }),
          ...findingParagraphs,
          ...(result.precedents.length > 0
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  children: [new TextRun({ text: "Referenced Authorities" })],
                }),
                ...precedentParagraphs,
              ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(
    blob,
    `insafdost-matter-${result._case_num}-${sanitizeFilename(result.category)}.docx`,
  );
}
