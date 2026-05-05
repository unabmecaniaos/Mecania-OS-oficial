import Link from "next/link";
import { BudgetStatus } from "@prisma/client";
import { notFound } from "next/navigation";

import { PortalBudgetResponseForm } from "@/app/portal/budgets/portal-budget-response-form";
import { BudgetStatusBadge } from "@/modules/budgets/budget-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { normalizeError } from "@/lib/errors";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { BUDGET_ITEM_TYPE_LABELS, BUDGET_STATUS_LABELS } from "@/modules/budgets/budget.constants";
import { getCustomerPortalBudgetDetail } from "@/modules/customer-portal/customer-portal.service";

type CustomerBudgetDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerBudgetDetailPage({
  params,
}: CustomerBudgetDetailPageProps) {
  const { id } = await params;
  const budget = await getCustomerPortalBudgetDetail(id).catch((error) => {
    if (normalizeError(error).statusCode === 404) {
      notFound();
    }

    throw error;
  });

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              {budget.budgetNumber}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-semibold">{budget.title}</h1>
              <BudgetStatusBadge status={budget.status} />
            </div>
            <p className="mt-3 text-sm text-[color:var(--muted-strong)]">
              {budget.vehicle.make} {budget.vehicle.model} / {budget.vehicle.plate ?? budget.vehicle.vin}
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Enviado {formatDate(budget.sentAt ?? budget.createdAt)}
            </p>
          </div>

          <Link href="/portal">
            <Button variant="secondary">Volver al portal</Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Resumen
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold">Detalle del presupuesto</h2>
            </div>

            <div className="mt-5 space-y-4">
              {budget.items.map((item) => (
                <div
                  className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4"
                  key={item.id}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        {BUDGET_ITEM_TYPE_LABELS[item.itemType]}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                        {item.description}
                      </h3>
                      <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                        {item.referenceCode ?? "Sin codigo"} / Cantidad {item.quantity}
                      </p>
                      {item.note ? (
                        <p className="mt-2 text-sm text-[color:var(--muted)]">{item.note}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[250px]">
                      <div className="rounded-lg border border-[color:var(--border)] bg-white p-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                          Unitario
                        </p>
                        <p className="mt-2 font-heading text-lg font-semibold">
                          {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[color:var(--border)] bg-white p-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                          Subtotal
                        </p>
                        <p className="mt-2 font-heading text-lg font-semibold">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Historial
            </p>
            <div className="mt-4 space-y-3">
              {budget.statusLogs.map((log) => (
                <div
                  className="rounded-xl border border-[color:var(--border)] bg-white/75 px-4 py-3"
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

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Totales
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-[rgba(185,28,28,0.18)] bg-[rgba(185,28,28,0.05)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#991b1b]">Repuestos</p>
                <p className="mt-3 text-2xl font-semibold text-[#7f1d1d]">
                  {formatCurrency(budget.subtotalParts)}
                </p>
              </div>
              <div className="rounded-xl border border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.05)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#1d4ed8]">Mano de obra</p>
                <p className="mt-3 text-2xl font-semibold text-[#1e3a8a]">
                  {formatCurrency(budget.subtotalLabor)}
                </p>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Suministros
                </p>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
                  {formatCurrency(budget.subtotalSupplies)}
                </p>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Total</p>
                <p className="mt-3 font-heading text-3xl font-semibold text-[color:var(--foreground)]">
                  {formatCurrency(budget.totalAmount)}
                </p>
              </div>
            </div>
          </Card>

          <Card
            className={
              budget.status === BudgetStatus.APPROVED
                ? "rounded-2xl border border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.05)]"
                : budget.status === BudgetStatus.REJECTED
                  ? "rounded-2xl border border-[rgba(185,28,28,0.18)] bg-[rgba(185,28,28,0.05)]"
                  : "rounded-2xl border border-[rgba(217,119,6,0.18)] bg-[rgba(217,119,6,0.05)]"
            }
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Tu respuesta
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold">
                  {budget.insuranceCase
                    ? "Revision por aseguradora"
                    : budget.status === BudgetStatus.SENT
                      ? "Responder al presupuesto"
                    : budget.status === BudgetStatus.APPROVED
                      ? "Presupuesto aprobado"
                      : budget.status === BudgetStatus.REJECTED
                        ? "Presupuesto rechazado"
                        : "Presupuesto convertido en orden"}
                </h2>
              </div>

              {budget.insuranceCase ? null : (
                <PortalBudgetResponseForm budgetId={budget.id} status={budget.status} />
              )}

              {budget.status === BudgetStatus.CONVERTED_TO_WORK_ORDER && budget.workOrder ? (
                <div className="rounded-xl border border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.06)] p-4">
                  <p className="text-sm font-semibold text-[#166534]">
                    Orden vinculada: {budget.workOrder.orderNumber}
                  </p>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
