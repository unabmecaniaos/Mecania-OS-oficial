"use client";

import type { FormHTMLAttributes, ReactNode } from "react";
import { useRef } from "react";

type AutoSubmitFilterFormProps = FormHTMLAttributes<HTMLFormElement> & {
  children: ReactNode;
  debounceMs?: number;
};

export function AutoSubmitFilterForm({
  children,
  debounceMs = 450,
  onChange,
  ...props
}: AutoSubmitFilterFormProps) {
  const timeoutRef = useRef<number | null>(null);

  return (
    <form
      {...props}
      onChange={(event) => {
        onChange?.(event);

        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }

        const target = event.target;
        const isTextInput =
          target instanceof HTMLInputElement &&
          ["search", "text", "email", "tel", "url"].includes(target.type);
        const delay = isTextInput ? debounceMs : 0;
        const form = event.currentTarget;

        timeoutRef.current = window.setTimeout(() => {
          form.requestSubmit();
        }, delay);
      }}
    >
      {children}
    </form>
  );
}
