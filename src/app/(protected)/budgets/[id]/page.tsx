import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { BudgetDetailForm } from "@/app/(protected)/budgets/budget-detail-form";
import { BUDGET_STATUS_LABELS } from "@/modules/budgets/budget.constants";
import { getBudgetById } from "@/modules/budgets/budget.service";

type BudgetDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BudgetDetailPage({ params }: BudgetDetailPageProps) {
  const { id } = await params;
  const budget = await getBudgetById(id);

  return (
    <div className="space-y-6">
      <BudgetDetailForm
        budget={{
          id: budget.id,
          title: budget.title,
          summary: budget.summary,
          status: budget.status,
          budgetNumber: budget.budgetNumber,
          subtotalParts: budget.subtotalParts,
          subtotalLabor: budget.subtotalLabor,
          subtotalSupplies: budget.subtotalSupplies,
          laborCostAmount: budget.laborCostAmount,
          workshopMarginPct: budget.workshopMarginPct,
          discountAmount: budget.discountAmount,
          vatAmount: budget.vatAmount,
          totalAmount: budget.totalAmount,
          workOrder: budget.workOrder
            ? {
                id: budget.workOrder.id,
                orderNumber: budget.workOrder.orderNumber,
              }
            : null,
          selfInspection: budget.selfInspection
            ? {
                id: budget.selfInspection.id,
              }
            : null,
          insuranceCase: budget.insuranceCase
            ? {
                id: budget.insuranceCase.id,
                caseNumber: budget.insuranceCase.caseNumber,
                liquidatorName: budget.insuranceCase.liquidator.name,
              }
            : null,
          client: {
            fullName: budget.client.fullName,
          },
          vehicle: {
            make: budget.vehicle.make,
            model: budget.vehicle.model,
            plate: budget.vehicle.plate,
            vin: budget.vehicle.vin,
          },
          items: budget.items.map((item) => ({
            id: item.id,
            itemType: item.itemType,
            description: item.description,
            referenceCode: item.referenceCode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            sourceLabel: item.sourceLabel,
            sourceUrl: item.sourceUrl,
            note: item.note,
          })),
        }}
      />

      <Card className="rounded-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
          Historial de estado
        </p>
        <div className="mt-4 space-y-3">
          {budget.statusLogs.map((log) => (
            <div
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3"
              key={log.id}
            >
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                {BUDGET_STATUS_LABELS[log.nextStatus]}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                {log.changedBy.name} / {formatDateTime(log.changedAt)}
              </p>
              {log.note ? (
                <p className="mt-1 text-sm text-[color:var(--muted)]">{log.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}



