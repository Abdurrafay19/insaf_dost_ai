export function GroundingInfo() {
  return (
    <details className="rounded-md border border-border bg-card px-4 py-3 text-xs">
      <summary className="cursor-pointer font-medium text-foreground">
        What is the grounding score?
      </summary>
      <p className="mt-2 leading-relaxed text-muted-foreground">
        After the analysis is written, a second AI model compares the start of
        it with the first part of up to three retrieved authorities. It rates
        how closely the analysis stays within them, from 0 to 100 percent. It
        does not check that the law is correct, current, or complete, and the
        model can make mistakes too.
      </p>
    </details>
  );
}
