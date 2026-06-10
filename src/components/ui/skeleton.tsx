import type { HTMLAttributes } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-[var(--radius-control)] bg-[color:var(--surface-strong)]",
        className,
      )}
      {...props}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-36" />
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card className="space-y-4" key={index}>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-36" />
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-52" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton className="h-16 w-full" key={index} />
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-44" />
          </div>
          {Array.from({ length: 4 }, (_, index) => (
            <div className="space-y-2" key={index}>
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
