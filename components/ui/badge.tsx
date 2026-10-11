import * as React from "react";

import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "success" | "warning" | "alert";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "border border-border bg-secondary text-foreground",
    outline: "border border-border bg-card text-muted-foreground",
    success: "border border-success/30 bg-success-tint text-success",
    warning: "border border-warning/30 bg-warning-tint text-warning",
    alert: "border border-destructive/30 bg-destructive-tint text-destructive",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium leading-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
