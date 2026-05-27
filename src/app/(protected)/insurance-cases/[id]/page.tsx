import Link from "next/link";
import { notFound } from "next/navigation";

import { BudgetStatusBadge } from "@/modules/budgets/budget-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { normalizeError } from "@/lib/errors";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { BUDGET_ITEM_TYPE_LABELS } from "@/modules/budgets/budget.constants";
import { getInternalInsuranceCaseDetail } from "@/modules/insurance-cases/insurance-case.service";
import { getInsuranceCasePhotoViewUrl } from "@/modules/insurance-cases/insurance-case.routes";
import { WORK_ORDER_STATUS_LABELS } from "@/modules/work-orders/work-order.constants";

export default async function InternalInsuranceCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const insuranceCase = await getInternalInsuranceCaseDetail(id).catch((error) => {
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
              {insuranceCase.caseNumber}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">
              {insuranceCase.vehicle.make} {insuranceCase.vehicle.model}
            </h1>
            <p className="mt-3 text-sm text-[color:var(--muted-strong)]">
              Titular: {insuranceCase.ownerFullName}
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Liquidadora: {insuranceCase.liquidator.name}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/budgets/new?kind=liquidator&insuranceCaseId=${insuranceCase.id}`}>
              <Button>Crear presupuesto</Button>
            </Link>
            <Link href="/insurance-cases">
              <Button variant="secondary">Volver a siniestros</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Solicitud de evaluacion</h2>
            <div className="mt-4 space-y-3 text-sm text-[color:var(--muted-strong)]">
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Siniestro:</span>{" "}
                {insuranceCase.claimNumber ?? "Sin numero externo"}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Poliza:</span>{" "}
                {insuranceCase.policyNumber ?? "Sin poliza"}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Fecha del choque:</span>{" "}
                {formatDate(insuranceCase.incidentDate)}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Lugar:</span>{" "}
                {insuranceCase.incidentLocation ?? "Sin ubicacion"}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Descripcion:</span>{" "}
                {insuranceCase.description}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Fotos iniciales</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {insuranceCase.photos.map((photo) => (
                <div
                  className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3"
                  key={photo.id}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={photo.fileName}
                    className="h-44 w-full rounded-xl object-cover"
                    src={getInsuranceCasePhotoViewUrl(photo.id)}
                  />
                  <p className="mt-3 text-xs text-[color:var(--muted)]">
                    {formatDateTime(photo.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Presupuesto conectado</h2>
            {insuranceCase.latestBudget ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <BudgetStatusBadge status={insuranceCase.latestBudget.status} />
                  <Link
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                    href={`/budgets/${insuranceCase.latestBudget.id}`}
                  >
                    Abrir {insuranceCase.latestBudget.budgetNumber}
                  </Link>
                </div>
                <p className="text-sm text-[color:var(--muted-strong)]">
                  Total actual: {formatCurrency(insuranceCase.latestBudget.totalAmount)}
                </p>
                <div className="space-y-3">
                  {insuranceCase.latestBudget.items.map((item) => (
                    <div
                      className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4"
                      key={item.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {item.description}
                          </p>
                          <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                            {BUDGET_ITEM_TYPE_LABELS[item.itemType]} / Cantidad {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-[color:var(--foreground)]">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[color:var(--muted)]">
                Todavia no existe un presupuesto enlazado a este caso.
              </p>
            )}
          </Card>

          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Orden de trabajo conectada</h2>
            {insuranceCase.currentWorkOrder ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={insuranceCase.currentWorkOrder.status} />
                  <Link
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                    href={`/work-orders/${insuranceCase.currentWorkOrder.id}`}
                  >
                    Abrir {insuranceCase.currentWorkOrder.orderNumber}
                  </Link>
                </div>
                <div className="space-y-3">
                  {insuranceCase.currentWorkOrder.statusLogs.map((log) => (
                    <div
                      className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4"
                      key={log.id}
                    >
                      <p className="font-semibold text-[color:var(--foreground)]">
                        {WORK_ORDER_STATUS_LABELS[log.nextStatus]}
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
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
