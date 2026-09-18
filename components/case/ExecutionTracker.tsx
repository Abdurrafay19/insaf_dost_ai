"use client";

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

function statusSymbol(status: NodeStatus): string {
  if (status === "done") return "[x]";
  if (status === "active") return "[~]";
  return "[ ]";
}

function statusClass(status: NodeStatus): string {
  if (status === "done") return "text-foreground";
  if (status === "active") return "text-foreground font-semibold";
  return "text-muted-foreground";
}

interface ExecutionTrackerProps {
  progress: CaseProgress[];
}

export function ExecutionTracker({ progress }: ExecutionTrackerProps) {
  if (progress.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="border border-border bg-card"
    >
      <div className="border-b border-border px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Execution Status
      </div>
      <div className="divide-y divide-border">
        {progress.map((item) => (
          <div key={item.caseNum} className="px-4 py-3 font-mono text-xs">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-foreground">
                Matter {item.caseNum} / {item.totalCases}
              </span>
              <span className="uppercase tracking-wider text-muted-foreground">
                {item.status === "error" ? "Error" : item.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {PIPELINE_ORDER.map((node) => (
                <span key={node} className={statusClass(item.nodes[node])}>
                  {statusSymbol(item.nodes[node])} {NODE_LABELS[node]}
                </span>
              ))}
            </div>
            {item.status === "error" && item.errorDetail ? (
              <p className="mt-2 border-t border-border pt-2 text-destructive">
                {item.errorDetail}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
