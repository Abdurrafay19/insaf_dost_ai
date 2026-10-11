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
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document.getElementById(`case-${caseNum}`)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <nav
      aria-label="Jump to matter"
      className="sticky top-(--header-h) z-40 -mx-4 flex flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-2.5 sm:-mx-8 sm:px-8"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Jump to:
      </span>
      {results.map((result) => (
        <button
          key={result._case_num}
          type="button"
          onClick={() => scrollToCase(result._case_num)}
          className="inline-flex h-8 items-center rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98] motion-reduce:active:scale-100"
        >
          Matter {result._case_num}
        </button>
      ))}
    </nav>
  );
}
