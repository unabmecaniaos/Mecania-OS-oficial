import { WorkOrderStatus } from "@prisma/client";

import { cn } from "@/lib/utils";
import {
  getWorkOrderProgressPercent,
  WORK_ORDER_STATUS_LABELS,
} from "@/modules/work-orders/work-order.constants";

type WorkOrderProgressProps = {
  status: WorkOrderStatus;
  progressPercent?: number;
  className?: string;
};

export function WorkOrderProgress({
  status,
  progressPercent: providedProgressPercent,
  className,
}: WorkOrderProgressProps) {
  const progressPercent = providedProgressPercent ?? getWorkOrderProgressPercent(status);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
        <span>Progreso</span>
        <span>{progressPercent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[rgba(37,99,235,0.10)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#17345e_0%,#2563eb_100%)] transition-[width]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-sm text-[color:var(--muted-strong)]">
        Estado actual: {WORK_ORDER_STATUS_LABELS[status]}
      </p>
    </div>
  );
}
