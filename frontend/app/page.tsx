"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  CheckCircle2,
  Gavel,
  Landmark,
  Loader2,
  Scale,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeCases, checkBackendHealth } from "@/lib/insafdost-api";
import type { AnalysisCaseResult, AnalysisResponse } from "@/types/insafdost";

type BackendStatus = "loading" | "connected" | "offline";

const DEFAULT_SCENARIO =
  "A man was caught stealing a motorcycle from a market parking area. The owner has CCTV footage and witnesses. What legal remedies and criminal charges may apply?";

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function getAuditTone(score: number): string {
  if (score >= 0.8) {
    return "text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/20";
  }

  if (score >= 0.5) {
    return "text-amber-300 bg-amber-500/10 ring-1 ring-amber-500/20";
  }

  return "text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/20";
}

function StatusDot({ status }: { status: BackendStatus }) {
  const classes =
    status === "connected"
      ? "bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.12)]"
      : status === "offline"
        ? "bg-rose-400 shadow-[0_0_0_5px_rgba(248,113,113,0.12)]"
        : "bg-amber-400 shadow-[0_0_0_5px_rgba(251,191,36,0.12)]";

  return <span className={`inline-flex h-2.5 w-2.5 rounded-full ${classes}`} />;
}

function keywordPills(keywords: string | undefined | null): string[] {
  if (!keywords || typeof keywords !== "string") {
    return [];
  }

  return keywords
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCases(input: string): string[] {
  const trimmedInput = input.trim();
  const startsWithCaseNumber = /^\s*\d+\.\s+/.test(trimmedInput);

  if (!startsWithCaseNumber) {
    return trimmedInput ? [trimmedInput] : [];
  }

  const splitPattern = /^\s*\d+\.\s+|[.!?]\s*\d+\.\s+/m;

  return trimmedInput
    .split(splitPattern)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function ResultItem({ result }: { result: AnalysisCaseResult }) {
  const keywords = keywordPills(result.legal_keywords || "");

  return (
    <section className="relative pl-8 pb-12 last:pb-0 last:before:hidden before:absolute before:left-2.25 before:top-0 before:bottom-0 before:w-px before:bg-white/10">
      <div className="absolute left-0 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-[#0d0f12]">
        <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(203,168,106,0.55)]" />
      </div>

      <div className="space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary/80">
              Case {result._case_num}
            </span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/55">
              {result.category}
            </span>
            <Badge
              variant="outline"
              className={`ml-auto border-white/10 ${getAuditTone(result.audit_score)}`}
            >
              Audit {formatScore(result.audit_score)}
            </Badge>
          </div>

          <h3 className="text-2xl font-serif tracking-wide text-foreground sm:text-[1.55rem]">
            {result.category} Judgment
          </h3>

          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/55"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <div className="grid gap-6 2xl:grid-cols-2">
          <div className="space-y-6 2xl:border-r 2xl:border-white/5 2xl:pr-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-foreground/40">
                <Scale className="h-3.5 w-3.5" />
                Scenario Context
              </div>
              <p className="border-l border-white/10 pl-4 text-sm leading-7 text-foreground/80">
                {result.raw_text || "No scenario text available."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300/80">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Synthesis and Verdict
              </div>
              <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:font-serif prose-headings:tracking-wide prose-headings:text-foreground prose-strong:text-emerald-300 prose-code:border prose-code:border-white/10 prose-code:bg-black/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:font-mono">
                {result.final_answer && result.final_answer.trim() ? (
                  <ReactMarkdown>{result.final_answer}</ReactMarkdown>
                ) : (
                  <p className="text-sm text-foreground/45">
                    No judgment returned.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary/75">
              <Gavel className="h-3.5 w-3.5" />
              Referenced Authorities
            </div>

            <div className="space-y-3">
              {Array.isArray(result.precedents) &&
              result.precedents.length > 0 ? (
                result.precedents.map((precedent, index) => {
                  const meta = result.precedent_meta?.[index];

                  return (
                    <div
                      key={`${result._case_num}-${index}`}
                      className="rounded-xl border border-white/5 bg-white/2.5 px-4 py-4 transition-colors hover:bg-white/4"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <span className="text-xs font-medium text-foreground/75">
                          {meta?.source ?? `Authority ${index + 1}`}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary/55">
                          Score {meta?.score ? meta.score.toFixed(3) : "N/A"}
                        </span>
                      </div>

                      <div className="prose prose-sm prose-invert max-w-none prose-p:m-0 prose-p:leading-7 prose-headings:font-serif prose-strong:text-foreground">
                        {precedent && precedent.trim() ? (
                          <ReactMarkdown>{precedent}</ReactMarkdown>
                        ) : (
                          <p className="text-sm text-foreground/45">
                            No precedent text available.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/2 px-4 py-4 text-sm text-foreground/45">
                  <Search className="h-4 w-4 text-foreground/30" />
                  No precedents were found for this scenario.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("loading");
  const [statusMessage, setStatusMessage] = useState("Checking systems...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedCaseCount = useMemo(
    () => parseCases(scenario).length,
    [scenario],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadStatus() {
      const result = await checkBackendHealth(controller.signal);
      setBackendStatus(result.connected ? "connected" : "offline");
      setStatusMessage(result.message);
    }

    loadStatus();

    return () => controller.abort();
  }, []);

  const analysisSummary = useMemo(() => {
    if (!analysis?.data?.length) {
      return null;
    }

    const totalCases = analysis.data.length;
    const averageAudit =
      analysis.data.reduce((sum, current) => sum + current.audit_score, 0) /
      totalCases;

    return {
      totalCases,
      averageAudit,
    };
  }, [analysis]);

  async function handleAnalyze() {
    const trimmedScenario = scenario.trim();

    if (!trimmedScenario) {
      setErrorMessage("Please enter a legal scenario before proceeding.");
      return;
    }

    const parsedCases = parseCases(trimmedScenario);

    if (parsedCases.length === 0) {
      setErrorMessage("No cases identified in the submitted scenario.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const result = await analyzeCases(parsedCases);
      setAnalysis(result);
    } catch (error) {
      setAnalysis(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Analysis failed.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#0d0f12] text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="w-full border-b border-white/10 bg-[#0d0f12]/95 px-6 py-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_20px_rgba(203,168,106,0.12)]">
              <Landmark className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg tracking-wide sm:text-xl">
                  InsafDost AI
                </h1>
                <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/45">
                  Core
                </span>
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-foreground/40">
                Pakistani Jurisprudence Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/3 px-4 py-2 text-xs text-foreground/70">
            <StatusDot status={backendStatus} />
            <span className="font-medium uppercase tracking-[0.22em] text-foreground/55">
              {backendStatus === "connected"
                ? "Systems Nominal"
                : statusMessage}
            </span>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <section className="flex w-[35%] min-w-[320px] max-w-130 flex-col gap-8 overflow-y-auto border-r border-white/10 px-8 py-8 custom-scrollbar">
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/75">
              Scenario Intake
            </div>
            <h2 className="font-serif text-3xl tracking-wide text-foreground">
              Draft the case
            </h2>
          </div>

          <form
            className="flex min-h-0 flex-1 flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              void handleAnalyze();
            }}
          >
            <div className="border-b border-white/10 pb-5">
              <Textarea
                value={scenario}
                onChange={(event) => setScenario(event.target.value)}
                placeholder="Describe the incident, evidence, and legal question here. In cases involving multiple incidents, please number each one for clarity (e.g., '1. Incident one details... 2. Incident two details...')."
                aria-label="Legal scenario input"
                className="bg-transparent p-0 text-[15px] leading-8 text-foreground/95 placeholder:text-foreground/25"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                <span>Engine: Legal AI</span>
                <span>
                  {parsedCaseCount} case{parsedCaseCount === 1 ? "" : "s"}{" "}
                  detected
                </span>
              </div>

              <Button
                type="submit"
                disabled={isAnalyzing || parsedCaseCount === 0}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold tracking-wide text-primary-foreground shadow-[0_10px_30px_rgba(203,168,106,0.18)] transition-transform hover:-translate-y-px hover:bg-primary/90"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    Execute Analysis
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>

        <section className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(203,168,106,0.04),transparent_45%)] px-8 py-8 custom-scrollbar sm:px-10 lg:px-12">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <div className="space-y-3 border-b border-white/10 pb-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/40">
                Output Synthesis
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl tracking-wide text-foreground sm:text-4xl">
                    Jurisprudential findings
                  </h2>
                </div>

                {analysisSummary ? (
                  <div className="flex gap-3">
                    <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                        Cases
                      </div>
                      <div className="mt-1 text-2xl font-serif text-foreground">
                        {analysisSummary.totalCases}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                        Avg audit
                      </div>
                      <div className="mt-1 text-2xl font-serif text-foreground">
                        {formatScore(analysisSummary.averageAudit)}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {analysis?.status === "success" && analysis.data.length > 0 ? (
              <div className="space-y-10">
                {analysis.data.map((result) => (
                  <ResultItem key={result._case_num} result={result} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-105 flex-col items-center justify-center rounded-none border border-dashed border-white/10 bg-white/2 px-8 py-16 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/20 text-primary/75">
                  <Scale className="h-8 w-8" />
                </div>
                <h3 className="font-serif text-2xl tracking-wide text-foreground">
                  Awaiting submission
                </h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-foreground/48">
                  The analysis stream will appear here after you submit a
                  scenario.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

    </div>
  );
}
