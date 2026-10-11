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
      <p className="rounded-control bg-secondary p-4 text-sm text-muted-foreground">
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
        // The backend uses source "System" for its "nothing relevant found" notice.
        const isSystemNotice = meta?.source === "System";

        return (
          <li key={index} className="rounded-control bg-secondary p-4">
            {isSystemNotice ? null : (
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 break-words font-mono text-xs font-medium text-foreground">
                  {source}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant="outline">
                    Relevance{" "}
                    {meta?.score !== undefined ? meta.score.toFixed(2) : "N/A"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleCopy(index, source)}
                    aria-label={`Copy citation ${source}`}
                  >
                    {isCopied ? (
                      <Check aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Copy aria-hidden="true" className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            <p
              dir="auto"
              className={
                "whitespace-pre-line break-words font-serif text-[0.9375rem] leading-relaxed text-foreground" +
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
