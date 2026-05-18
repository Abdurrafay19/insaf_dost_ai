import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, onChange, rows = 7, style, value, defaultValue, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement, []);

  React.useLayoutEffect(() => {
    const element = textareaRef.current;

    if (!element) {
      return;
    }

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value, defaultValue]);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const element = textareaRef.current;

    if (element) {
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    }

    onChange?.(event);
  }

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      className={cn(
        "flex w-full resize-none overflow-hidden rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={style}
      onChange={handleChange}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";