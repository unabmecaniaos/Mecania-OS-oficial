import { BudgetStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { BUDGET_STATUS_LABELS } from "@/modules/budgets/budget.constants";

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  const tone =
    status === BudgetStatus.APPROVED || status === BudgetStatus.CONVERTED_TO_WORK_ORDER
      ? "success"
      : status === BudgetStatus.PARTIALLY_APPROVED
        ? "warning"
      : status === BudgetStatus.SENT
        ? "warning"
        : "info";

  return (
    <Badge
      className={
        status === BudgetStatus.REJECTED
          ? "border-[rgba(180,35,24,0.2)] bg-[color:var(--danger-soft)] text-[color:var(--danger)]"
          : status === BudgetStatus.REQUEST_CHANGES
            ? "border-[rgba(161,92,7,0.2)] bg-[color:var(--warning-soft)] text-[color:var(--warning)]"
            : undefined
      }
      tone={tone}
    >
      {BUDGET_STATUS_LABELS[status]}
    </Badge>
  );
}
