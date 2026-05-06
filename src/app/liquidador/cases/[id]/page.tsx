import Link from "next/link";
import { notFound } from "next/navigation";
import { BudgetStatus, WorkOrderStatus } from "@prisma/client";

import { LiquidatorBudgetResponseForm } from "@/app/liquidador/liquidator-budget-response-form";
import { BudgetStatusBadge } from "@/modules/budgets/budget-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { normalizeError } from "@/lib/errors";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { BUDGET_ITEM_TYPE_LABELS } from "@/modules/budgets/budget.constants";
import {
  getLiquidatorInsuranceCaseDetail,
  INSURANCE_CASE_STAGE_LABELS,
} from "@/modules/insurance-cases/insurance-case.service";
import { WORK_ORDER_STATUS_LABELS } from "@/modules/work-orders/work-order.constants";

const timelineSteps = ["INGRESADO", "PRESUPUESTADO", "EN_REPARACION", "LISTO"] as const;

export default async function LiquidatorCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const insuranceCase = await getLiquidatorInsuranceCaseDetail(id).catch((error) => {
    if (normalizeError(error).statusCode === 404) {
      notFound();
    }

    throw error;
  });

  const latestBudget = insuranceCase.latestBudget;
  const currentWorkOrder = insuranceCase.currentWorkOrder;
  const finalGalleryEnabled =
    currentWorkOrder?.status === WorkOrderStatus.READY_FOR_DELIVERY ||
    currentWorkOrder?.status === WorkOrderStatus.DELIVERED;

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
              {insuranceCase.ownerFullName} /{" "}
              {insuranceCase.vehicle.plate ?? insuranceCase.vehicle.vin}
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Estado del caso: {insuranceCase.stageLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/liquidador">
              <Button variant="secondary">Volver al portal</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Registro del siniestro
            </p>
            <div className="mt-4 space-y-3 text-sm text-[color:var(--muted-strong)]">
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Titular:</span>{" "}
                {insuranceCase.ownerFullName}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Numero de caso:</span>{" "}
                {insuranceCase.caseNumber}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Numero de siniestro:</span>{" "}
                {insuranceCase.claimNumber ?? "Sin numero externo"}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Poliza:</span>{" "}
                {insuranceCase.policyNumber ?? "Sin poliza informada"}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Fecha del choque:</span>{" "}
                {formatDate(insuranceCase.incidentDate)}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Lugar:</span>{" "}
                {insuranceCase.incidentLocation ?? "Sin ubicacion registrada"}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Descripcion:</span>{" "}
                {insuranceCase.description}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Fotos iniciales
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {insuranceCase.photos.map((photo) => (
                <div
                  className="rounded-xl border border-[color:var(--border)] bg-white/70 p-3"
                  key={photo.id}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={photo.fileName}
                    className="h-44 w-full rounded-xl object-cover"
                    src={photo.fileUrl}
                  />
                  <p className="mt-3 text-sm text-[color:var(--muted)]">
                    {formatDateTime(photo.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Linea de tiempo
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {timelineSteps.map((step, index) => {
                const currentIndex = timelineSteps.indexOf(insuranceCase.stage);
                const completed = index <= currentIndex;

                return (
                  <div
                    className={
                      completed
                        ? "rounded-xl border border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.08)] p-4"
                        : "rounded-xl border border-[color:var(--border)] bg-white/70 p-4"
                    }
                    key={step}
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Paso {index + 1}
                    </p>
                    <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                      {INSURANCE_CASE_STAGE_LABELS[step]}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="rounded-2xl">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Presupuesto del taller
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold">
                {latestBudget ? latestBudget.title : "Aun sin presupuesto enviado"}
              </h2>
            </div>

            {latestBudget ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <BudgetStatusBadge status={latestBudget.status} />
                  <p className="text-sm text-[color:var(--muted-strong)]">
                    {latestBudget.budgetNumber} / Total {formatCurrency(latestBudget.totalAmount)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Repuestos
                    </p>
                    <p className="mt-2 font-semibold">{formatCurrency(latestBudget.subtotalParts)}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Mano de obra
                    </p>
                    <p className="mt-2 font-semibold">{formatCurrency(latestBudget.subtotalLabor)}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Suministros
                    </p>
                    <p className="mt-2 font-semibold">
                      {formatCurrency(latestBudget.subtotalSupplies)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {latestBudget.items.map((item) => (
                    <div
                      className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4"
                      key={item.id}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                            {BUDGET_ITEM_TYPE_LABELS[item.itemType]}
                          </p>
                          <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                            {item.description}
                          </p>
                          <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                            {item.referenceCode ?? "Sin codigo"} / Cantidad {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-[color:var(--foreground)]">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {latestBudget.status === BudgetStatus.SENT ? (
                  <LiquidatorBudgetResponseForm
                    budgetId={latestBudget.id}
                    caseId={insuranceCase.id}
                    status={latestBudget.status}
                  />
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card className="rounded-2xl">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Seguimiento del trabajo
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold">
                {currentWorkOrder ? currentWorkOrder.orderNumber : "Trabajo aun no iniciado"}
              </h2>
            </div>

            {currentWorkOrder ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={currentWorkOrder.status} />
                  <p className="text-sm text-[color:var(--muted-strong)]">
                    {WORK_ORDER_STATUS_LABELS[currentWorkOrder.status]}
                  </p>
                </div>

                <div className="space-y-3">
                  {currentWorkOrder.statusLogs.map((log) => (
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

                {finalGalleryEnabled ? (
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      Galeria final del trabajo
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {currentWorkOrder.evidences.map((evidence) => (
                        <div
                          className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3"
                          key={evidence.id}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={evidence.fileName}
                            className="h-44 w-full rounded-xl object-cover"
                            src={evidence.fileUrl}
                          />
                          <p className="mt-3 text-sm text-[color:var(--muted-strong)]">
                            {evidence.note ?? "Sin comentario"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
