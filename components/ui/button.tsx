import * as React from "react";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    default:
      "bg-primary text-primary-foreground border-primary hover:bg-stone-800",
    secondary:
      "bg-secondary text-secondary-foreground border-border hover:bg-muted",
    outline: "bg-card text-foreground border-border hover:border-border-strong",
    ghost:
      "bg-transparent border-transparent text-foreground hover:bg-secondary",
  };

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    default: "h-11 px-5 py-2.5",
    sm: "h-9 px-3.5 py-2 text-sm",
    lg: "h-12 px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-none border font-mono text-xs font-semibold uppercase tracking-wider transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
