import type { PrecedentMeta } from "@/types/insafdost";

interface PrecedentListProps {
  precedents: string[];
  precedentMeta: PrecedentMeta[];
}

export function PrecedentList({
  precedents,
  precedentMeta,
}: PrecedentListProps) {
  if (precedents.length === 0) {
    return (
      <p className="border border-dashed border-border bg-card px-4 py-4 font-mono text-xs text-muted-foreground">
        No precedents were retrieved for this matter.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {precedents.map((precedent, index) => {
        const meta = precedentMeta[index];
        const cleanText = precedent.replace(/\\n/g, "\n").trim();

        return (
          <div key={index} className="border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3.5 py-2">
              <span className="font-mono text-xs font-semibold text-foreground">
                {meta?.source ?? `Authority ${index + 1}`}
              </span>
              <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                Relevance{" "}
                {meta?.score !== undefined ? meta.score.toFixed(2) : "N/A"}
              </span>
            </div>
            <p className="px-3.5 py-3 font-serif text-sm leading-relaxed text-foreground">
              {cleanText || "No precedent text available."}
            </p>
          </div>
        );
      })}
    </div>
  );
}
