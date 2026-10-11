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
      className="glass sticky top-(--header-h) z-40 -mx-4 flex flex-wrap items-center gap-2 px-4 py-2.5 sm:-mx-8 sm:px-8"
    >
      <span className="text-sm text-muted-foreground">Jump to</span>
      {results.map((result) => (
        <button
          key={result._case_num}
          type="button"
          onClick={() => scrollToCase(result._case_num)}
          className="h-10 rounded-full bg-card px-4 text-sm font-medium text-foreground shadow-sm ring-1 ring-border transition-[background-color,transform] duration-100 hover:bg-secondary active:scale-[0.98] motion-reduce:active:scale-100"
        >
          Matter {result._case_num}
        </button>
      ))}
    </nav>
  );
}
