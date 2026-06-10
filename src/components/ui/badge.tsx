import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "warning" | "success" | "info";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        tone === "neutral" &&
          "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--muted-strong)]",
        tone === "warning" &&
          "border-[rgba(161,92,7,0.2)] bg-[color:var(--warning-soft)] text-[color:var(--warning)]",
        tone === "success" &&
          "border-[rgba(20,122,75,0.2)] bg-[color:var(--success-soft)] text-[color:var(--success)]",
        tone === "info" &&
          "border-[rgba(36,88,198,0.2)] bg-[color:var(--info-soft)] text-[color:var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
