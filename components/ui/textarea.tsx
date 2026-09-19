import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

function TextareaImpl(
  {
    className,
    onChange,
    rows = 7,
    style,
    value,
    defaultValue,
    ...props
  }: TextareaProps,
  ref: React.ForwardedRef<HTMLTextAreaElement>,
) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useImperativeHandle(
    ref,
    () => textareaRef.current as HTMLTextAreaElement,
    [],
  );

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
        "flex w-full resize-none overflow-hidden rounded-none border border-input bg-card px-3.5 py-3 font-serif text-sm leading-relaxed text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={style}
      onChange={handleChange}
      {...props}
    />
  );
}

export const Textarea = React.forwardRef(TextareaImpl);
Textarea.displayName = "Textarea";
