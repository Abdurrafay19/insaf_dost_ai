import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="glass sticky top-0 z-50 h-(--header-h) w-full">
      <div className="mx-auto flex h-full max-w-380 items-center px-4 sm:px-8">
        <Link
          href="/"
          aria-label="InsafDost AI home"
          className="flex items-center gap-2.5 rounded-control"
        >
          <Image
            src="/icon.png"
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-7"
          />
          <span className="text-base font-semibold tracking-tight text-foreground">
            InsafDost AI
          </span>
        </Link>
        <span className="ml-3 hidden border-l border-border pl-3 text-sm text-muted-foreground sm:inline">
          Pakistan legal research
        </span>
      </div>
    </header>
  );
}