import Link from "next/link";

import { REPO_URL } from "@/lib/site";

const linkClass =
  "inline-block py-2 underline-offset-4 hover:text-foreground hover:underline";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-380 flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-[60ch]">
          InsafDost AI is an experimental research aid. It is not legal advice
          and it can be wrong.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5">
          <Link href="/privacy" className={linkClass}>
            Privacy policy
          </Link>
          <Link href="/terms" className={linkClass}>
            Terms of use
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Source code
          </a>
        </nav>
      </div>
    </footer>
  );
}
