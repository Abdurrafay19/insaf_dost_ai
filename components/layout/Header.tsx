import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-(--header-h) w-full border-b border-border bg-background">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="InsafDost AI home"
            className="flex items-center gap-2.5 rounded-control transition-opacity hover:opacity-90"
          >
            <Image
              src="/icon.png"
              alt=""
              width={26}
              height={26}
              priority
              className="h-6.5 w-6.5"
            />
            <span className="text-base font-semibold tracking-tight text-foreground">
              InsafDost AI
            </span>
          </Link>
          <span className="hidden border-l border-border pl-3 text-xs font-medium text-muted-foreground sm:inline">
            Pakistan Legal Research
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}