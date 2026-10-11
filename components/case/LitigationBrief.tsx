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

// Model output uses "#" and "##" headings. Render every one as an h5 so the
// page outline stays valid (the section labels above them are h4).
function MarkdownHeading({ children }: { children?: React.ReactNode }) {
  return (
    <h5 className="mb-2 mt-6 font-sans text-base font-semibold text-foreground">
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
        className="font-medium underline underline-offset-2"
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

function excerpt(text: string, max = 110): string {
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
      <Card>
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="min-w-0 flex-1 text-lg font-semibold leading-snug text-foreground">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={bodyId}
              onClick={toggleOpen}
              className="flex w-full items-start gap-3 rounded-control text-left"
            >
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
              />
              <span className="min-w-0">
                <span className="block">Matter {result._case_num}</span>
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

        <div
          id={bodyId}
          inert={!isOpen}
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-6 px-5 pb-5">
              {isRejected ? null : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCopy()}
                  >
                    {copied ? (
                      <Check aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Copy aria-hidden="true" className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy findings"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleExport("pdf")}
                  >
                    <FileDown aria-hidden="true" className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleExport("docx")}
                  >
                    <FileType aria-hidden="true" className="h-4 w-4" />
                    Word
                  </Button>
                  <span role="status" className="sr-only">
                    {copied ? "Findings copied" : ""}
                  </span>
                </div>
              )}
              {actionError ? (
                <p role="alert" className="text-sm text-destructive">
                  {actionError}
                </p>
              ) : null}

              <div
                className={cn(
                  "grid gap-8",
                  isRejected ? null : "xl:grid-cols-[minmax(0,1fr)_26rem]",
                )}
              >
                <div className="flex min-w-0 flex-col gap-6">
                  <section>
                    <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                      Scenario
                    </h4>
                    <p
                      dir="auto"
                      className="max-w-[68ch] whitespace-pre-wrap break-words rounded-control bg-secondary p-4 font-serif text-base leading-[1.65] text-foreground"
                    >
                      {result.raw_text || "No scenario text available."}
                    </p>
                  </section>

                  {keywords.length > 0 ? (
                    <section>
                      <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                        Statutory keywords
                      </h4>
                      <ul className="flex flex-wrap gap-2">
                        {keywords.map((keyword, index) => (
                          <li key={`${keyword}-${index}`}>
                            <Badge variant="default">{keyword}</Badge>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <section>
                    <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                      {isRejected ? "Result" : "Findings"}
                    </h4>
                    <div className="prose max-w-[68ch] font-serif prose-p:leading-[1.65] prose-li:leading-[1.65]">
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
                </div>

                {isRejected ? null : (
                  <section>
                    <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                      Referenced authorities
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
        </div>
      </Card>
    </article>
  );
});
