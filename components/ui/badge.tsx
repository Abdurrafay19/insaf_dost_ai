import * as React from "react";

import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "solid" | "alert";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "border-border bg-muted text-foreground",
    outline: "border-border bg-card text-muted-foreground",
    solid: "border-primary bg-primary text-primary-foreground",
    alert: "border-destructive/30 bg-destructive/5 text-destructive",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-none border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider leading-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
