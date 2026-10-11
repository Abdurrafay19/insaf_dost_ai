"use client";

import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CaseProgress, NodeStatus, PipelineNode } from "@/types/insafdost";

const PIPELINE_ORDER: PipelineNode[] = [
  "guardrail",
  "processor",
  "retriever",
  "reasoner",
  "auditor",
];

const NODE_LABELS: Record<PipelineNode, string> = {
  guardrail: "Guardrail",
  processor: "Processor",
  retriever: "Retriever",
  reasoner: "Reasoner",
  auditor: "Auditor",
};

const NODE_STATUS_TEXT: Record<NodeStatus, string> = {
  pending: "pending",
  active: "in progress",
  done: "done",
};

const CASE_STATUS_TEXT: Record<CaseProgress["status"], string> = {
  queued: "Queued",
  running: "Running",
  complete: "Complete",
  error: "Failed",
};

function caseBadgeVariant(
  status: CaseProgress["status"],
): "outline" | "success" | "alert" {
  if (status === "complete") return "success";
  if (status === "error") return "alert";
  return "outline";
}

function friendlyError(detail?: string): string {
  if (detail && /429|rate.?limit|busy/i.test(detail)) {
    return "The AI service is busy. Wait a minute and try again.";
  }
  return "This matter could not be analyzed. Try again in a moment.";
}

function liveMessage(progress: CaseProgress[]): string {
  const failed = progress.find((item) => item.status === "error");
  if (failed) {
    return `Matter ${failed.caseNum} failed.`;
  }

  const running = progress.find((item) => item.status === "running");
  if (running) {
    return `Matter ${running.caseNum} of ${running.totalCases}: ${running.activeLabel ?? "running"}.`;
  }

  if (progress.every((item) => item.status === "complete")) {
    return "Analysis complete.";
  }

  return "Analysis queued.";
}

function Step({ status, label }: { status: NodeStatus; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        aria-hidden="true"
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full",
          status === "done" && "bg-primary text-primary-foreground",
          status === "active" && "bg-accent",
          status === "pending" && "bg-muted",
        )}
      >
        {status === "done" ? (
          <Check className="h-3 w-3" strokeWidth={3} />
        ) : null}
        {status === "active" ? (
          <span className="h-2 w-2 rounded-full bg-primary motion-safe:animate-pulse" />
        ) : null}
      </span>
      <span
        className={status === "pending" ? "text-muted-foreground" : undefined}
      >
        {label}
        <span className="sr-only">, {NODE_STATUS_TEXT[status]}</span>
      </span>
    </li>
  );
}

interface ExecutionTrackerProps {
  progress: CaseProgress[];
}

export function ExecutionTracker({ progress }: ExecutionTrackerProps) {
  if (progress.length === 0) {
    return null;
  }

  return (
    <Card>
      <p role="status" className="sr-only">
        {liveMessage(progress)}
      </p>
      <h2 className="px-5 pt-5 text-sm font-semibold text-foreground">
        Progress
      </h2>
      <ul className="divide-y divide-border">
        {progress.map((item) => (
          <li key={item.caseNum} className="flex flex-col gap-3 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                Matter {item.caseNum} of {item.totalCases}
              </span>
              <Badge variant={caseBadgeVariant(item.status)}>
                {CASE_STATUS_TEXT[item.status]}
              </Badge>
            </div>
            <ol className="flex flex-wrap gap-x-5 gap-y-2">
              {PIPELINE_ORDER.map((node) => (
                <Step
                  key={node}
                  status={item.nodes[node]}
                  label={NODE_LABELS[node]}
                />
              ))}
            </ol>
            {item.status === "error" ? (
              <div className="rounded-control bg-destructive-tint p-3 text-sm text-destructive">
                <p>{friendlyError(item.errorDetail)}</p>
                {item.errorDetail ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">
                      Technical detail
                    </summary>
                    <p className="mt-1 break-words font-mono text-xs">
                      {item.errorDetail.slice(0, 300)}
                    </p>
                  </details>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
