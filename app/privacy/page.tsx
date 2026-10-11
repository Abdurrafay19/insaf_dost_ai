import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CONTACT_EMAIL, REPO_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What happens to the text you enter into InsafDost AI, where it is sent, and what is logged.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
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
        <h1>Privacy policy</h1>
        <p>Last updated: October 11, 2026</p>
        <p>
          InsafDost AI is an experimental legal research tool for Pakistani law.
          This page explains what happens to the text you enter.
        </p>

        <h2>What you give us</h2>
        <p>
          The tool needs only the text you type into the matter boxes. You can
          send up to 5 matters per request, up to 15,000 characters each. The
          site has no accounts, no sign-in, and no payments, and it does not
          ask for your name or email.
        </p>

        <h2>Please leave out personal details</h2>
        <p>
          Leave out names, CNIC numbers, phone numbers, addresses, and anything
          else that identifies a person. The analysis does not need them.
        </p>

        <h2>Where your text goes</h2>
        <p>
          When you press Analyze cases, your browser sends the text to our
          analysis service, which runs on Hugging Face Spaces. That service
          sends your text to AI models served by Groq (openai/gpt-oss-120b and
          openai/gpt-oss-20b). The models check that the text describes a legal
          dispute, extract legal search terms, write the analysis, and rate how
          closely the analysis follows the retrieved authorities. The search
          terms extracted from your text are used to search a database of
          Pakistani case law hosted on Qdrant Cloud.
        </p>
        <p>
          Hugging Face, Groq, and Qdrant handle that data under their own terms
          and privacy policies. We do not control how long they keep it.
        </p>

        <h2>What our analysis service logs</h2>
        <p>
          The analysis service writes operational logs. Log lines contain the
          length of each matter, its category, and error types. They do not
          contain the text of your matters or the search terms extracted from
          them. Hugging Face stores those logs and controls how long they are
          kept. We do not copy submissions into a database.
        </p>

        <h2>On your device</h2>
        <p>
          Your draft text is kept in your browser&apos;s session storage so it
          survives a page refresh. It is deleted when you close the tab and
          when you press Clear all. Earlier versions of this site kept drafts
          in local storage. This version deletes that old copy the first time
          you visit. The site&apos;s own code does not set cookies.
        </p>
        <p>
          Copying findings and exporting PDF or Word files happen in your
          browser. Those files are not uploaded.
        </p>

        <h2>Analytics</h2>
        <p>
          This site uses Vercel Web Analytics and Vercel Speed Insights to count
          page views and measure page speed. Vercel states that Web Analytics
          does not use cookies and identifies visitors with a hash created from
          the request. Read{" "}
          <a
            href="https://vercel.com/docs/analytics/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vercel&apos;s privacy notes for Web Analytics
          </a>
          . We run no advertising and no other trackers.
        </p>

        <h2>Deleting your data</h2>
        <p>
          Because the site has no accounts and we do not store submissions in a
          database, we cannot look up or delete a particular submission. Clear
          your draft by pressing Clear all or by closing the tab.
        </p>

        <h2>Questions and changes</h2>
        <p>
          {CONTACT_EMAIL ? (
            <>
              Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
              with questions about this policy.
            </>
          ) : (
            <>
              Open an issue in the{" "}
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                project repository
              </a>{" "}
              with questions about this policy.
            </>
          )}{" "}
          If this policy changes, the date at the top changes.
        </p>

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
