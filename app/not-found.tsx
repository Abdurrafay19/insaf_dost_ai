import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-4 px-4 py-16 sm:px-8"
    >
      <h1 className="text-3xl font-semibold text-foreground">
        Page not found
      </h1>
      <p className="max-w-[60ch] text-base text-muted-foreground">
        That page does not exist.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-control bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        Back to InsafDost AI
      </Link>
    </main>
  );
}
