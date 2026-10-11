import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { REPO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The rules for using InsafDost AI, including what it can and cannot be used for.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-8"
    >
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to InsafDost AI
        </Link>
      </div>

      <article className="prose">
        <h1>Terms of use</h1>
        <p>Last updated: October 11, 2026</p>

        <h2>Research aid only</h2>
        <p>
          InsafDost AI produces AI-generated research. It is not legal advice,
          it does not create a lawyer-client relationship, and it does not
          replace a licensed advocate.
        </p>

        <h2>It can be wrong</h2>
        <p>
          The analysis can be incorrect, outdated, or incomplete, and cited
          authorities can be missing or mismatched. The grounding score is an AI
          estimate of how closely the analysis follows the retrieved
          authorities. It is not a measure of legal accuracy. Check every
          authority against the official source before you rely on it.
        </p>

        <h2>What not to use it for</h2>
        <p>
          Do not use it for emergencies, court deadlines, or any decision where
          an error could harm you or others, unless a licensed advocate has
          reviewed the matter.
        </p>

        <h2>Your input</h2>
        <p>
          Only submit text you have the right to share, and leave out personal
          details. The privacy policy explains where your text goes.
        </p>

        <h2>Availability</h2>
        <p>
          The service can be slow, unavailable, or change without notice. The
          first request after a quiet period can take longer while the analysis
          engine starts.
        </p>

        <h2>Software license</h2>
        <p>
          The source code is available under the{" "}
          <a
            href={`${REPO_URL}/blob/main/LICENSE.md`}
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT license
          </a>
          .
        </p>

        <h2>No warranty</h2>
        <p>The service is provided as is, without warranty of any kind.</p>

        <div className="not-prose mt-12 border-t border-border pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to InsafDost AI
          </Link>
        </div>
      </article>
    </main>
  );
}
