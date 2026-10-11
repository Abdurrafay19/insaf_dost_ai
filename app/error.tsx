"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-4 px-4 py-16 sm:px-8"
    >
      <h1 className="text-3xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="max-w-[60ch] text-base text-muted-foreground">
        The page failed to load. Your draft is still saved in this tab. Try
        again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
