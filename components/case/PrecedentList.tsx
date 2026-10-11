"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copyCitationToClipboard } from "@/lib/export";
import type { PrecedentMeta } from "@/types/insafdost";

interface PrecedentListProps {
  precedents: string[];
  precedentMeta: PrecedentMeta[];
}

export function PrecedentList({
  precedents,
  precedentMeta,
}: PrecedentListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleCopy(index: number, source: string) {
    try {
      await copyCitationToClipboard(source);
      setCopiedIndex(index);
      setTimeout(
        () => setCopiedIndex((prev) => (prev === index ? null : prev)),
        1500,
      );
    } catch {
      // Clipboard access denied or unavailable; no-op.
    }
  }

  if (precedents.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
        No precedents were retrieved for this matter.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {precedents.map((precedent, index) => {
        const meta = precedentMeta[index];
        const source = meta?.source ?? `Authority ${index + 1}`;
        const cleanText = precedent.replace(/\\n/g, "\n").trim();
        const isCopied = copiedIndex === index;
        const isSystemNotice = meta?.source === "System";

        return (
          <li key={index} className="rounded-md border border-border bg-card p-4">
            {isSystemNotice ? null : (
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <p className="min-w-0 break-words font-mono text-xs font-semibold text-foreground">
                  {source}
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-[11px]">
                    Relevance{" "}
                    {meta?.score !== undefined ? meta.score.toFixed(2) : "N/A"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleCopy(index, source)}
                    aria-label={`Copy citation ${source}`}
                    className="h-7 w-7"
                  >
                    {isCopied ? (
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    ) : (
                      <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            <p
              dir="auto"
              className={
                "whitespace-pre-line break-words font-serif text-sm leading-relaxed text-foreground" +
                (isSystemNotice ? "" : " mt-3")
              }
            >
              {cleanText || "No precedent text available."}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
