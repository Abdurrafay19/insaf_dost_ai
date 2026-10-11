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

  const adjustHeight = React.useCallback(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [value, defaultValue, adjustHeight]);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange?.(event);
  }

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      className={cn(
        "flex max-h-[60vh] w-full resize-none overflow-y-auto rounded-control border border-input bg-card px-3.5 py-3 font-sans text-base leading-relaxed text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
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
