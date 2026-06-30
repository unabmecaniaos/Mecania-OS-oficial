import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StickyFormHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function StickyFormHeader({
  actions,
  className,
  description,
  eyebrow,
  status,
  title,
}: StickyFormHeaderProps) {
  return (
    <Card
      className={cn(
        "sticky top-4 z-20 rounded-2xl border-[rgba(148,163,184,0.28)] bg-white/95 px-5 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.10)] backdrop-blur",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              {eyebrow}
            </p>
            {status}
          </div>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-[color:var(--muted-strong)]">{description}</p>
          ) : null}
        </div>

        {actions ? <div className="flex flex-col gap-2 sm:flex-row">{actions}</div> : null}
      </div>
    </Card>
  );
}
