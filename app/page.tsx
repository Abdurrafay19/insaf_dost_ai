"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { CaseInputWorkspace } from "@/components/case/CaseInputWorkspace";
import { ExecutionTracker } from "@/components/case/ExecutionTracker";
import { LitigationBrief } from "@/components/case/LitigationBrief";
import { Button } from "@/components/ui/button";
import { streamAnalysis } from "@/lib/insafdost-api";
import type {
  CaseProgress,
  CaseResponseItem,
  NodeStatus,
  PipelineNode,
  StreamEvent,
} from "@/types/insafdost";

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
  const [cases, setCases] = useState<string[]>([""]);
  const [progress, setProgress] = useState<CaseProgress[]>([]);
  const [results, setResults] = useState<CaseResponseItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const validCaseCount = useMemo(
    () => cases.filter((item) => item.trim().length > 0).length,
    [cases],
  );

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
      if (!(error instanceof DOMException && error.name === "AbortError")) {
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="mx-auto flex w-full max-w-380 flex-1 flex-col gap-8 px-4 py-6 sm:px-8">
        <section className="border border-border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Case Scenario &amp; Legal Questions
            </h1>
            <span className="font-mono text-xs text-muted-foreground">
              Batch Query Analysis
            </span>
          </div>

          <CaseInputWorkspace
            cases={cases}
            onChange={setCases}
            disabled={isAnalyzing}
          />

          {errorMessage ? (
            <div className="mt-4 border border-destructive/30 bg-destructive/5 px-4 py-3 font-mono text-xs text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row">
            <Button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={isAnalyzing || validCaseCount === 0}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Facts
                </>
              ) : (
                <>
                  Analyze Cases
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            {isAnalyzing ? (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </section>

        {progress.length > 0 ? <ExecutionTracker progress={progress} /> : null}

        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Legal Analysis
            </h2>
            {results.length > 0 ? (
              <span className="border border-border bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
                {results.length} Matter{results.length === 1 ? "" : "s"}{" "}
                Analyzed
              </span>
            ) : null}
          </div>

          {results.length > 0 ? (
            <div className="flex flex-col gap-6">
              {results.map((result) => (
                <LitigationBrief key={result._case_num} result={result} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center border border-dashed border-border px-8 py-16 text-center">
              <h3 className="font-heading text-lg font-bold text-foreground">
                Awaiting submission
              </h3>
              <p className="mt-2 max-w-md font-serif text-sm leading-relaxed text-muted-foreground">
                Analysis results will appear here after you submit one or more
                matters.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
