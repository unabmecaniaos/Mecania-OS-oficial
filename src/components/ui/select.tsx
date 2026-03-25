import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[rgba(55,168,255,0.38)] focus:ring-4 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}
