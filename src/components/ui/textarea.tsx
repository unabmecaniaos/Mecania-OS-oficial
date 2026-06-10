import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-4 py-3 text-sm text-[color:var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none placeholder:text-[color:var(--muted)] hover:border-[color:var(--border-strong)] focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(36,88,198,0.14)] disabled:cursor-not-allowed disabled:bg-[color:var(--surface-strong)] disabled:text-[color:var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}
