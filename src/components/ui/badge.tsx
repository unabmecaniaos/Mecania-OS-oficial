import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "warning" | "success" | "info";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        tone === "neutral" &&
          "border-[color:var(--border)] bg-[rgba(34,50,74,0.75)] text-[color:var(--muted-strong)]",
        tone === "warning" &&
          "border-[rgba(210,167,44,0.26)] bg-[rgba(210,167,44,0.12)] text-[color:var(--warning)]",
        tone === "success" &&
          "border-[rgba(35,193,107,0.24)] bg-[rgba(35,193,107,0.12)] text-[color:var(--success)]",
        tone === "info" &&
          "border-[rgba(76,195,255,0.24)] bg-[rgba(76,195,255,0.12)] text-[color:var(--info)]",
        className,
      )}
      {...props}
    />
  );
}
