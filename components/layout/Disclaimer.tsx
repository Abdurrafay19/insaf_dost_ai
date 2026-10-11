import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

interface DisclaimerProps {
  className?: string;
}

export function Disclaimer({ className }: DisclaimerProps) {
  return (
    <aside
      role="note"
      aria-label="Disclaimer"
      className={cn(
        "flex gap-3 rounded-md border border-warning/30 bg-warning-tint/40 p-3.5 text-xs text-foreground",
        className,
      )}
    >
      <TriangleAlert
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-warning"
      />
      <p className="leading-relaxed">
        <strong className="font-semibold">Not legal advice.</strong> InsafDost
        AI is an experimental research aid. It can be wrong or incomplete.
        Check every cited authority against the official source, and consult a
        licensed advocate before taking action.
      </p>
    </aside>
  );
}
