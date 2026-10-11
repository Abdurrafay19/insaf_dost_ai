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
        "flex gap-3 rounded-control bg-warning-tint p-4 text-sm text-foreground",
        className,
      )}
    >
      <TriangleAlert
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-warning"
      />
      <p>
        <strong className="font-semibold">Not legal advice.</strong> InsafDost
        AI is an experimental research aid. It can be wrong or incomplete.
        Check every cited authority against the official source, and ask a
        licensed advocate before you act.
      </p>
    </aside>
  );
}
