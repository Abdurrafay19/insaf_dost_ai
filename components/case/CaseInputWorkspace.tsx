"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_CASES = 5;

interface CaseInputWorkspaceProps {
  cases: string[];
  onChange: (cases: string[]) => void;
  disabled?: boolean;
}

export function CaseInputWorkspace({
  cases,
  onChange,
  disabled = false,
}: CaseInputWorkspaceProps) {
  function updateCase(index: number, value: string) {
    const next = [...cases];
    next[index] = value;
    onChange(next);
  }

  function removeCase(index: number) {
    if (cases.length <= 1) {
      return;
    }

    onChange(cases.filter((_, i) => i !== index));
  }

  function addCase() {
    if (cases.length >= MAX_CASES) {
      return;
    }

    onChange([...cases, ""]);
  }

  function clearAll() {
    onChange([""]);
  }

  const atMaxCases = cases.length >= MAX_CASES;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex flex-col gap-4">
        {cases.map((caseText, index) => (
          <div key={index} className="border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-3.5 py-2">
              <label
                htmlFor={`case-input-${index}`}
                className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Matter {String(index + 1).padStart(2, "0")}
              </label>
              <button
                type="button"
                onClick={() => removeCase(index)}
                disabled={disabled || cases.length <= 1}
                aria-label={`Remove matter ${index + 1}`}
                className="inline-flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <Textarea
              id={`case-input-${index}`}
              value={caseText}
              onChange={(event) => updateCase(index, event.target.value)}
              disabled={disabled}
              rows={6}
              placeholder="Describe the incident, evidence, and legal question for this matter."
              className="border-0 bg-transparent"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCase}
            disabled={disabled || atMaxCases}
            className="flex-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Another Matter
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={disabled}
          >
            Clear All
          </Button>
        </div>
        {atMaxCases ? (
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Batch limit reached — up to {MAX_CASES} matters per submission.
          </p>
        ) : null}
      </div>
    </div>
  );
}