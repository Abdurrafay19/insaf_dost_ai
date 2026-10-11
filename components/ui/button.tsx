import * as React from "react";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
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
      "border border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
    secondary:
      "border border-transparent bg-secondary text-secondary-foreground hover:bg-muted",
    outline:
      "border border-border-strong bg-card text-foreground hover:bg-secondary",
    ghost:
      "border border-transparent bg-transparent text-foreground hover:bg-secondary",
  };

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    default: "h-11 px-5 text-sm",
    sm: "h-10 px-3.5 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10 p-0 text-sm",
  };

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-[background-color,transform] duration-100 active:scale-[0.98] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
