"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

import { CaseInputWorkspace, MAX_CASES } from "@/components/case/CaseInputWorkspace";
import { ExecutionTracker } from "@/components/case/ExecutionTracker";
import { GroundingInfo } from "@/components/case/GroundingInfo";
import { LitigationBrief } from "@/components/case/LitigationBrief";
import { ResultsNav } from "@/components/case/ResultsNav";
import { Disclaimer } from "@/components/layout/Disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { streamAnalysis } from "@/lib/insafdost-api";
import { useSessionStorageState } from "@/lib/use-session-storage";
import type {
  CaseProgress,
  CaseResponseItem,
  NodeStatus,
  PipelineNode,
  StreamEvent,
} from "@/types/insafdost";

const DRAFT_STORAGE_KEY = "insafdost:draft-cases";
// Earlier versions kept drafts in localStorage. Remove that copy on first visit.
const LEGACY_LOCAL_STORAGE_KEY = "insafdost:draft-cases";

const INITIAL_CASES: string[] = [""];

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_CASES &&
    value.every((item) => typeof item === "string")
  );
}

const EMPTY_NODES: Record<PipelineNode, NodeStatus> = {
  guardrail: "pending",
  processor: "pending",
  retriever: "pending",
  reasoner: "pending",
  auditor: "pending",
};

function createProgress(caseNum: number, totalCases: number): CaseProgress {
  return {
    caseNum,
    totalCases,
    status: "queued",
    nodes: { ...EMPTY_NODES },
  };
}

export default function Home() {
  const [cases, setCases] = useSessionStorageState<string[]>(
    DRAFT_STORAGE_KEY,
    INITIAL_CASES,
    isStringArray,
  );
  const [progress, setProgress] = useState<CaseProgress[]>([]);
  const [results, setResults] = useState<CaseResponseItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
    } catch {
      // Storage unavailable; nothing to clean up.
    }
  }, []);

  const handleEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case "case_start": {
        setProgress((prev) => {
          if (prev.some((item) => item.caseNum === event.case_num)) {
            return prev;
          }
          return [...prev, createProgress(event.case_num, event.total_cases)];
        });
        break;
      }
      case "node_start": {
        setProgress((prev) =>
          prev.map((item) =>
            item.caseNum === event.case_num
              ? {
                  ...item,
                  status: "running",
                  activeLabel: event.label,
                  nodes: { ...item.nodes, [event.node]: "active" },
                }
              : item,
          ),
        );
        break;
      }
      case "node_complete": {
        setProgress((prev) =>
          prev.map((item) =>
            item.caseNum === event.case_num
              ? { ...item, nodes: { ...item.nodes, [event.node]: "done" } }
              : item,
          ),
        );
        break;
      }
      case "case_complete": {
        setProgress((prev) =>
          prev.map((item) =>
            item.caseNum === event.case_num
              ? { ...item, status: "complete" }
              : item,
          ),
        );
        setResults((prev) =>
          [
            ...prev.filter((item) => item._case_num !== event.case_num),
            event.data,
          ].sort((a, b) => a._case_num - b._case_num),
        );
        break;
      }
      case "error": {
        setProgress((prev) =>
          prev.map((item) =>
            item.caseNum === event.case_num
              ? { ...item, status: "error", errorDetail: event.detail }
              : item,
          ),
        );
        break;
      }
      case "done": {
        setIsAnalyzing(false);
        break;
      }
      default:
        break;
    }
  }, []);

  async function handleAnalyze() {
    const trimmedCases = cases.map((item) => item.trim()).filter(Boolean);

    if (trimmedCases.length === 0) {
      setErrorMessage("Add at least one matter before running analysis.");
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setProgress([]);
    setResults([]);

    try {
      await streamAnalysis(trimmedCases, handleEvent, controller.signal);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setErrorMessage(
          error instanceof Error ? error.message : "Analysis failed.",
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleCancel() {
    abortControllerRef.current?.abort();
    setIsAnalyzing(false);
  }

  const handleClearAll = useCallback(() => {
    setCases(INITIAL_CASES);
    setProgress([]);
    setResults([]);
    setErrorMessage(null);
  }, [setCases]);

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10"
    >
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          Describe your legal situation
        </h1>
        <p className="max-w-[60ch] text-base text-muted-foreground">
          Add up to {MAX_CASES} matters. For each one, InsafDost AI finds
          related Pakistani authorities and drafts an analysis you can review,
          copy, or export.
        </p>
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="mb-5 text-xl font-semibold text-foreground">
          Your matters
        </h2>

        <CaseInputWorkspace
          cases={cases}
          onChange={setCases}
          onClear={handleClearAll}
          disabled={isAnalyzing}
        />

        {errorMessage ? (
          <div
            role="alert"
            className="mt-5 rounded-control bg-destructive-tint px-4 py-3 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => void handleAnalyze()}
            disabled={isAnalyzing}
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <Loader2
                  aria-hidden="true"
                  className="h-4 w-4 motion-safe:animate-spin"
                />
                Analyzing
              </>
            ) : (
              <>
                Analyze cases
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </>
            )}
          </Button>
          {isAnalyzing ? (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          ) : null}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Your text is sent to our analysis service to produce the result.
          Remove names, ID numbers, and phone numbers first.{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Privacy policy
          </Link>
        </p>
      </Card>

      {progress.length > 0 ? <ExecutionTracker progress={progress} /> : null}

      <section aria-labelledby="results-heading" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="results-heading"
            className="text-2xl font-semibold text-foreground"
          >
            Results
          </h2>
          {results.length > 0 ? (
            <Badge variant="outline">
              {results.length} {results.length === 1 ? "matter" : "matters"}{" "}
              analyzed
            </Badge>
          ) : null}
        </div>

        <Disclaimer />

        {results.length > 0 ? <GroundingInfo /> : null}

        <ResultsNav results={results} />

        {results.length > 0 ? (
          <div className="flex flex-col gap-6">
            {results.map((result) => (
              <LitigationBrief key={result._case_num} result={result} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-card px-8 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              No results yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
              Results appear here after you submit one or more matters.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
