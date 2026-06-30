"use client";

import { useEffect } from "react";

import { FormMessage } from "@/components/ui/form-message";

export function FormErrorSummary({ message }: { message?: string }) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const summary = document.querySelector("[data-form-error-summary]");
    const form = summary?.closest("form") ?? document;
    const invalidField = form.querySelector<HTMLElement>(
      "[aria-invalid='true'], [data-invalid='true'], input:invalid, select:invalid, textarea:invalid",
    );
    const target = invalidField ?? summary;

    target?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    if (invalidField && "focus" in invalidField) {
      invalidField.focus({
        preventScroll: true,
      });
    }
  }, [message]);

  if (!message) {
    return null;
  }

  return (
    <div data-form-error-summary className="rounded-[var(--radius-card)] border border-[rgba(220,38,38,0.2)] bg-[#fef2f2] p-4">
      <p className="text-sm font-semibold text-[#991b1b]">Revisa el formulario antes de continuar</p>
      <div className="mt-2">
        <FormMessage message={message} />
      </div>
    </div>
  );
}
