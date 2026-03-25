import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(23,34,53,0.98)_0%,rgba(20,31,48,0.98)_100%)] p-6 shadow-[var(--shadow-md)]",
        className,
      )}
      {...props}
    />
  );
}
