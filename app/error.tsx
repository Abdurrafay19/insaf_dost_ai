"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

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
        The page encountered an error. Your draft is still saved in this tab. Try
        again or return to the home page.
      </p>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-control border border-border-strong bg-card px-5 text-sm font-semibold text-foreground transition-[background-color,transform] hover:bg-secondary active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to InsafDost AI
        </Link>
      </div>
    </main>
  );
}
