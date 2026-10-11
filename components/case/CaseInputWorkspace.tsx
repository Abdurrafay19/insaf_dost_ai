"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const MAX_CASES = 5;
export const MAX_CHARS_PER_CASE = 15000;

const COUNTER_THRESHOLD = Math.floor(MAX_CHARS_PER_CASE * 0.8);
const numberFormat = new Intl.NumberFormat("en-US");

interface CaseInputWorkspaceProps {
  cases: string[];
  onChange: (cases: string[]) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export const CaseInputWorkspace = React.memo(function CaseInputWorkspace({
  cases,
  onChange,
  onClear,
  disabled = false,
}: CaseInputWorkspaceProps) {
  function updateCase(index: number, value: string) {
    const next = [...cases];
    next[index] = value.slice(0, MAX_CHARS_PER_CASE);
    onChange(next);
  }

  function removeCase(index: number) {
    if (cases.length <= 1) {
      onChange([""]);
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
    onClear?.();
  }

  const atMaxCases = cases.length >= MAX_CASES;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        {cases.map((caseText, index) => {
          const counterId = `case-count-${index}`;
          const showCounter = caseText.length >= COUNTER_THRESHOLD;
          const atLimit = caseText.length >= MAX_CHARS_PER_CASE;

          return (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor={`case-input-${index}`}
                  className="text-sm font-semibold text-foreground"
                >
                  Matter {index + 1}
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCase(index)}
                  disabled={disabled || (cases.length <= 1 && caseText === "")}
                  aria-label={`Remove matter ${index + 1}`}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                id={`case-input-${index}`}
                dir="auto"
                value={caseText}
                onChange={(event) => updateCase(index, event.target.value)}
                disabled={disabled}
                rows={6}
                maxLength={MAX_CHARS_PER_CASE}
                aria-describedby={showCounter ? counterId : undefined}
                placeholder="Describe the incident, the evidence, and the legal question for this matter."
              />
              {showCounter ? (
                <p
                  id={counterId}
                  aria-live={atLimit ? "polite" : undefined}
                  className={cn(
                    "text-xs",
                    atLimit
                      ? "font-medium text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {numberFormat.format(caseText.length)} of{" "}
                  {numberFormat.format(MAX_CHARS_PER_CASE)} characters.
                  {atLimit ? " Limit reached. Extra text is not added." : ""}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={addCase}
            disabled={disabled || atMaxCases}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add another matter
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={disabled}
          >
            Clear all
          </Button>
        </div>
        {atMaxCases ? (
          <p className="text-xs text-muted-foreground">
            You can add up to {MAX_CASES} matters per submission.
          </p>
        ) : null}
      </div>
    </div>
  );
});