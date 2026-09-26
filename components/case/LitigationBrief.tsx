"use client";

import React, { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileDown,
  FileType,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/components/ui/badge";
import { PrecedentList } from "@/components/case/PrecedentList";
import {
  copyFindingsToClipboard,
  exportCaseAsDocx,
  exportCaseAsPdf,
} from "@/lib/export";
import type { CaseResponseItem } from "@/types/insafdost";

function auditVariant(score: number): "solid" | "default" | "alert" {
  if (score >= 0.8) return "solid";
  if (score >= 0.5) return "default";
  return "alert";
}

interface LitigationBriefProps {
  result: CaseResponseItem;
}

export const LitigationBrief = React.memo(function LitigationBrief({
  result,
}: LitigationBriefProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const keywords = result.legal_keywords
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const cleanAnswer = result.final_answer.replace(/\\n/g, "\n").trim();

  function toggleOpen() {
    setIsOpen((prev) => !prev);
  }

  async function handleCopy(event: React.MouseEvent) {
    event.stopPropagation();
    try {
      await copyFindingsToClipboard(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access denied or unavailable; no-op.
    }
  }

  async function handleExportPdf(event: React.MouseEvent) {
    event.stopPropagation();
    await exportCaseAsPdf(result);
  }

  async function handleExportDocx(event: React.MouseEvent) {
    event.stopPropagation();
    await exportCaseAsDocx(result);
  }

  return (
    <article
      id={`case-${result._case_num}`}
      className="scroll-mt-20 border border-border bg-card"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={toggleOpen}
        className="flex w-full cursor-pointer flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 text-left transition-colors duration-150 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{result.category}</Badge>
            <span className="font-mono text-[11px] text-muted-foreground">
              Matter {result._case_num}
            </span>
          </div>
          <h3 className="font-heading text-2xl font-bold text-foreground">
            Legal Analysis
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={auditVariant(result.audit_score)}>
            Audit {Math.round(result.audit_score * 100)}%
          </Badge>
          <span className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground">
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        </div>
      </button>

      {isOpen ? (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-5 py-2.5">
            <button
              type="button"
              onClick={(event) => void handleCopy(event)}
              className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy Findings"}
            </button>
            <button
              type="button"
              onClick={(event) => void handleExportPdf(event)}
              className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </button>
            <button
              type="button"
              onClick={(event) => void handleExportDocx(event)}
              className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              <FileType className="h-3.5 w-3.5" />
              Word
            </button>
          </div>

          <div className="grid gap-6 px-5 py-5 2xl:grid-cols-2">
            <div className="space-y-5 2xl:border-r 2xl:border-border 2xl:pr-6">
              <div>
                <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Scenario
                </span>
                <p className="border border-border bg-background px-3.5 py-3 font-serif text-sm leading-relaxed text-foreground">
                  {result.raw_text || "No scenario text available."}
                </p>
              </div>

              {keywords.length > 0 ? (
                <div>
                  <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Statutory Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((keyword, index) => (
                      <span
                        key={`${keyword}-${index}`}
                        className="border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Findings
                </span>
                <div className="prose prose-sm prose-stone max-w-none prose-headings:font-heading prose-p:leading-relaxed">
                  {cleanAnswer ? (
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => {
                          const isSafe =
                            href &&
                            (href.startsWith("http://") ||
                              href.startsWith("https://") ||
                              href.startsWith("#"));
                          if (!isSafe) {
                            return <span>{children}</span>;
                          }
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-2 hover:text-foreground"
                            >
                              {children}
                            </a>
                          );
                        },
                        img: () => null,
                      }}
                    >
                      {cleanAnswer}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No findings returned.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Referenced Authorities
              </span>
              <PrecedentList
                precedents={result.precedents}
                precedentMeta={result.precedent_meta}
              />
            </div>
          </div>
        </>
      ) : null}
    </article>
  );
});
