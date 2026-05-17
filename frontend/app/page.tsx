"use client";

import { useEffect, useMemo, useState } from "react";

import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  CheckCircle2,
  Gavel,
  Loader2,
  Scale,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (score >= 0.5) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function StatusDot({ status }: { status: BackendStatus }) {
  const classes =
    status === "connected"
      ? "bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]"
      : status === "offline"
        ? "bg-rose-500 shadow-[0_0_0_6px_rgba(244,63,94,0.12)]"
        : "bg-amber-500 shadow-[0_0_0_6px_rgba(245,158,11,0.14)]";

  return <span className={`inline-flex h-3 w-3 rounded-full ${classes}`} />;
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
  // Split by patterns like "1.", "2.", "3.", etc.
  const casePattern = /^\s*\d+\.\s+/gm;
  
  // Check if input contains numbered markers
  if (!casePattern.test(input)) {
    // No numbered markers, treat the whole input as one case
    return [input.trim()];
  }

  // Split by numbered markers (1., 2., 3., etc.)
  const cases = input
    .split(/^\s*\d+\.\s+/m)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return cases;
}

function ResultCard({ result }: { result: AnalysisCaseResult }) {
  const keywords = keywordPills(result.legal_keywords || "");

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <CardHeader className="space-y-4 border-b border-border/70 bg-slate-50/90">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Case {result._case_num}</Badge>
          <Badge variant="outline">{result.category}</Badge>
          <Badge className={getAuditTone(result.audit_score)}>
            Audit {formatScore(result.audit_score)}
          </Badge>
        </div>
        <CardTitle className="text-xl text-slate-900">{result.category} analysis</CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-600">
          Key terms: {keywords.length > 0 ? result.legal_keywords : "No keywords returned"}
        </CardDescription>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="outline" className="bg-white">
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5 py-6">
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Scale className="h-4 w-4 text-slate-500" />
            Scenario
          </div>
          <p className="rounded-2xl border border-border bg-slate-50/90 px-4 py-3 text-sm leading-7 text-slate-700">
            {result.raw_text || "No scenario text available."}
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Final answer
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 text-slate-800 prose prose-sm prose-emerald max-w-none dark:prose-invert">
            {result.final_answer && result.final_answer.trim() ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="text-sm leading-7">{children}</p>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-sm">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-sm">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold text-emerald-900">{children}</strong>,
                  em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
                  code: ({ children }) => <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-900">{children}</code>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-emerald-300 pl-3 italic text-slate-700 text-sm my-2">{children}</blockquote>,
                }}
              >
                {result.final_answer}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-slate-600">No final answer returned.</p>
            )}
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Gavel className="h-4 w-4 text-slate-500" />
            Precedents
          </div>

          <div className="space-y-3">
            {Array.isArray(result.precedents) && result.precedents.length > 0 ? (
              result.precedents.map((precedent, index) => {
                const meta = result.precedent_meta?.[index];

                return (
                  <div
                    key={`${result._case_num}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{meta?.source ?? `Authority ${index + 1}`}</Badge>
                      <Badge variant="outline">
                        Score {meta?.score ? meta.score.toFixed(3) : "N/A"}
                      </Badge>
                    </div>
                    <div className="text-sm leading-7 text-slate-700">
                      {precedent && precedent.trim() ? (
                        <div className="prose prose-sm prose-slate max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="text-sm leading-6 m-0">{children}</p>,
                              h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-semibold mt-2 mb-1">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-xs font-semibold mt-1 mb-1">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-sm ml-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-sm ml-2">{children}</ol>,
                              li: ({ children }) => <li className="text-sm">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                              em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
                              code: ({ children }) => <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                            }}
                          >
                            {precedent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">No precedent text available.</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                No precedents were returned for this case.
              </div>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("loading");
  const [statusMessage, setStatusMessage] = useState("Checking backend...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedCaseCount = useMemo(() => {
    return parseCases(scenario).length;
  }, [scenario]);

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
      analysis.data.reduce((sum, current) => sum + current.audit_score, 0) / totalCases;

    return {
      totalCases,
      averageAudit,
    };
  }, [analysis]);

  async function handleAnalyze() {
    const trimmedScenario = scenario.trim();

    if (!trimmedScenario) {
      setErrorMessage("Please enter a legal scenario before analyzing.");
      return;
    }

    const parsedCases = parseCases(trimmedScenario);

    if (parsedCases.length === 0) {
      setErrorMessage("No cases found in the input.");
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
        error instanceof Error ? error.message : "Unable to analyze the cases.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-4xl border border-white/70 bg-white/80 px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-slate-200">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  Pakistani Law Analysis
                </div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  InsafDost AI
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Structured analysis for legal scenarios with cited authorities and audit scoring.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <StatusDot status={backendStatus} />
              <div>
                <div className="font-semibold text-slate-900">Backend status</div>
                <div className="text-xs text-slate-500">{statusMessage}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <Card className="h-full border-slate-200/80 bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            <CardHeader className="space-y-3 border-b border-border/70 bg-slate-50/90">
              <Badge variant="secondary" className="w-fit">
                Input Panel
              </Badge>
              <CardTitle className="text-2xl text-slate-900">Describe the case</CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-600">
                Enter one or more legal scenarios. Use numbered markers (1., 2., 3., etc.) to separate multiple cases for batch analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAnalyze();
                }}
              >
                <Textarea
                  value={scenario}
                  onChange={(event) => setScenario(event.target.value)}
                  placeholder="Enter one or more cases. Separate multiple cases with numbered markers (1., 2., 3., etc.)"
                  aria-label="Legal scenario input"
                  className="min-h-72.5 bg-white"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    {parsedCaseCount === 1 ? (
                      <>1 case ready to analyze</>
                    ) : (
                      <>{parsedCaseCount} cases found (use "1.", "2.", etc. to separate)</>
                    )}
                  </div>
                  <Button type="submit" size="lg" disabled={isAnalyzing || parsedCaseCount === 0}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing {parsedCaseCount} {parsedCaseCount === 1 ? "case" : "cases"}
                      </>
                    ) : (
                      <>
                        Analyze {parsedCaseCount === 1 ? "Case" : "Cases"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
                <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                  <div className="font-semibold text-slate-900">Endpoint</div>
                  <div className="mt-1 break-all">POST /analyze</div>
                </div>
                <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                  <div className="font-semibold text-slate-900">Payload shape</div>
                  <div className="mt-1 break-all text-xs">{`{ cases: ["case1", "case2", ...] }`}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full border-slate-200/80 bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            <CardHeader className="space-y-3 border-b border-border/70 bg-slate-50/90">
              <Badge variant="secondary" className="w-fit">
                Results Feed
              </Badge>
              <CardTitle className="text-2xl text-slate-900">Structured response</CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-600">
                Displays the API response in a readable format for each analyzed case.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {analysisSummary ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Cases returned
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-950">
                      {analysisSummary.totalCases}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Average audit
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-950">
                      {formatScore(analysisSummary.averageAudit)}
                    </div>
                  </div>
                </div>
              ) : null}

              {analysis?.status === "success" && analysis.data.length > 0 ? (
                <div className="space-y-4">
                  {analysis.data.map((result) => (
                    <ResultCard key={result._case_num} result={result} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">
                    Waiting for analysis
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Once you submit a scenario, the response data will render here with the
                    category, keywords, precedents, final answer, and audit score.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
