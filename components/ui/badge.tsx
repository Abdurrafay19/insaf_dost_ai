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
    default: "bg-muted text-foreground",
    outline: "border border-border bg-card text-muted-foreground",
    success: "bg-success-tint text-success",
    warning: "bg-warning-tint text-warning",
    alert: "bg-destructive-tint text-destructive",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium leading-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
