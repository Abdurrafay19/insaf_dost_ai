import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="mx-auto flex max-w-380 items-center px-4 py-3 sm:h-14 sm:px-8 sm:py-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="InsafDost AI"
              width={28}
              height={28}
              priority
              className="h-7 w-7"
            />
            <span className="font-heading text-base font-bold tracking-tight text-foreground">
              InsafDost{" "}
              <span className="font-sans text-xs font-normal uppercase tracking-wider text-muted-foreground">
                AI
              </span>
            </span>
          </div>
          <span className="ml-1 border-l border-border pl-2.5 font-mono text-[11px] text-muted-foreground">
            Pakistan Legal Research
          </span>
        </div>
      </div>
    </header>
  );
}