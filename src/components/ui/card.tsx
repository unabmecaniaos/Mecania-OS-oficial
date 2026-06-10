import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-panel)] backdrop-blur-sm sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
