"use client";

import type { CaseResponseItem } from "@/types/insafdost";

interface ResultsNavProps {
  results: CaseResponseItem[];
}

export function ResultsNav({ results }: ResultsNavProps) {
  if (results.length < 2) {
    return null;
  }

  function scrollToCase(caseNum: number) {
    document
      .getElementById(`case-${caseNum}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Jump to matter"
      className="sticky top-14 z-40 -mx-4 flex flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-2.5 sm:-mx-8 sm:px-8"
    >
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Jump to:
      </span>
      {results.map((result) => (
        <button
          key={result._case_num}
          type="button"
          onClick={() => scrollToCase(result._case_num)}
          className="border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-foreground transition-colors duration-150 hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
        >
          Matter {result._case_num}
        </button>
      ))}
    </nav>
  );
}
