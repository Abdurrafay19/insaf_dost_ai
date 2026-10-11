"use client";

import React, { useId, useState } from "react";
import { Check, ChevronDown, Copy, FileDown, FileType } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrecedentList } from "@/components/case/PrecedentList";
import {
  copyFindingsToClipboard,
  exportCaseAsDocx,
  exportCaseAsPdf,
} from "@/lib/export";
import { cn } from "@/lib/utils";
import type { CaseResponseItem } from "@/types/insafdost";

function MarkdownHeading({ children }: { children?: React.ReactNode }) {
  return (
    <h5 className="mb-2 mt-5 text-base font-semibold text-foreground">
      {children}
    </h5>
  );
}

const markdownComponents: Components = {
  h1: MarkdownHeading,
  h2: MarkdownHeading,
  h3: MarkdownHeading,
  h4: MarkdownHeading,
  h5: MarkdownHeading,
  h6: MarkdownHeading,
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
        className="font-medium underline underline-offset-2 hover:text-foreground"
      >
        {children}
      </a>
    );
  },
  img: () => null,
};

function groundingVariant(score: number): "success" | "warning" | "alert" {
  if (score >= 0.8) return "success";
  if (score >= 0.5) return "warning";
  return "alert";
}

function excerpt(text: string, max = 120): string {
  const single = text.replace(/\s+/g, " ").trim();
  return single.length > max
    ? `${single.slice(0, max).trimEnd()}...`
    : single;
}

interface LitigationBriefProps {
  result: CaseResponseItem;
}

export const LitigationBrief = React.memo(function LitigationBrief({
  result,
}: LitigationBriefProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const bodyId = useId();

  const isRejected = result.is_valid === false;
  const percent = Math.round(result.audit_score * 100);

  const keywords = result.legal_keywords
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const cleanAnswer = result.final_answer.replace(/\\n/g, "\n").trim();

  function toggleOpen() {
    setIsOpen((prev) => !prev);
  }

  async function handleCopy() {
    setActionError(null);
    try {
      await copyFindingsToClipboard(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setActionError("Copy failed. Your browser blocked clipboard access.");
    }
  }

  async function handleExport(kind: "pdf" | "docx") {
    setActionError(null);
    try {
      if (kind === "pdf") {
        await exportCaseAsPdf(result);
      } else {
        await exportCaseAsDocx(result);
      }
    } catch {
      setActionError("Export failed. Check your connection and try again.");
    }
  }

  return (
    <article id={`case-${result._case_num}`} className="scroll-mt-14">
      <Card className="overflow-hidden border border-border bg-card">
        {/* Header Bar */}
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between border-b border-border/60">
          <h3 className="min-w-0 flex-1 text-lg font-semibold leading-snug text-foreground">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={bodyId}
              onClick={toggleOpen}
              className="flex w-full items-start gap-3 text-left transition-colors hover:text-foreground/80"
            >
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
              />
              <span className="min-w-0">
                <span className="block font-semibold">Matter {result._case_num}</span>
                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                  {excerpt(result.raw_text)}
                </span>
              </span>
            </button>
          </h3>
          <div className="flex shrink-0 flex-wrap items-center gap-2 pl-7 sm:justify-end sm:pl-0">
            <Badge variant="outline">{result.category}</Badge>
            {isRejected ? (
              <Badge variant="warning">Not analyzed</Badge>
            ) : (
              <Badge variant={groundingVariant(result.audit_score)}>
                Grounding {percent}%
              </Badge>
            )}
          </div>
        </div>

        {/* Collapsible Body */}
        <div
          id={bodyId}
          inert={!isOpen}
          className={cn(
            "transition-[grid-template-rows] duration-200 ease-out",
            isOpen ? "grid grid-rows-[1fr]" : "grid grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-8 p-5 sm:p-6">
              {/* Action Toolbar */}
              {isRejected ? null : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCopy()}
                  >
                    {copied ? (
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    ) : (
                      <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied" : "Copy findings"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleExport("pdf")}
                  >
                    <FileDown aria-hidden="true" className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleExport("docx")}
                  >
                    <FileType aria-hidden="true" className="h-3.5 w-3.5" />
                    Word
                  </Button>
                </div>
              )}

              {actionError ? (
                <p role="alert" className="text-sm text-destructive">
                  {actionError}
                </p>
              ) : null}

              {/* 1. Scenario */}
              <section className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Scenario
                </h4>
                <div
                  dir="auto"
                  className="rounded-md border border-border bg-secondary/40 p-4 font-serif text-sm leading-relaxed text-foreground"
                >
                  {result.raw_text || "No scenario text available."}
                </div>
              </section>

              {/* 2. Statutory Keywords */}
              {keywords.length > 0 ? (
                <section className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Statutory keywords
                  </h4>
                  <ul className="flex flex-wrap gap-1.5">
                    {keywords.map((keyword, index) => (
                      <li key={`${keyword}-${index}`}>
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {keyword}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* 3. Legal Findings / Analysis (Wide across the top to minimize scrolling fatigue) */}
              <section className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {isRejected ? "Result" : "Legal Analysis & Findings"}
                </h4>
                <div className="prose prose-neutral dark:prose-invert max-w-none font-serif text-base leading-relaxed prose-headings:font-sans prose-headings:font-semibold">
                  {cleanAnswer ? (
                    <ReactMarkdown components={markdownComponents}>
                      {cleanAnswer}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No findings returned.
                    </p>
                  )}
                </div>
              </section>

              {/* 4. Referenced Authorities (Cleanly placed at the END) */}
              {isRejected ? null : (
                <section className="flex flex-col gap-3 border-t border-border/80 pt-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Referenced Authorities & Precedents
                  </h4>
                  <PrecedentList
                    precedents={result.precedents}
                    precedentMeta={result.precedent_meta}
                  />
                </section>
              )}
            </div>
          </div>
        </div>
      </Card>
    </article>
  );
});
