import Link from "next/link";

import { WorkOrderProgress } from "@/components/customer-portal/work-order-progress";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BudgetStatusBadge } from "@/modules/budgets/budget-status-badge";
import { getCustomerPortalOverview } from "@/modules/customer-portal/customer-portal.service";
import {
  SELF_INSPECTION_RISK_LABELS,
  SELF_INSPECTION_STATUS_LABELS,
} from "@/modules/self-inspections/self-inspection.constants";

export default async function CustomerPortalPage() {
  const portal = await getCustomerPortalOverview();

  if (!portal.customer) {
    return (
      <Card className="rounded-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
          Portal cliente
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Tu acceso aun no esta habilitado</h1>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
          Portal cliente
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">
          Hola, {portal.customer.fullName}
        </h1>

        {portal.budgets.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-[rgba(37,99,235,0.16)] bg-[linear-gradient(135deg,rgba(37,99,235,0.10)_0%,rgba(14,34,63,0.08)_100%)] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[#1d4ed8]">
                  Presupuestos del cliente
                </p>
                <h2 className="font-heading text-2xl font-semibold">
                  {portal.stats.pendingBudgets > 0
                    ? `Tienes ${portal.stats.pendingBudgets} presupuesto${
                        portal.stats.pendingBudgets === 1 ? "" : "s"
                      } pendiente${portal.stats.pendingBudgets === 1 ? "" : "s"}`
                    : "Ya puedes revisar tus presupuestos enviados"}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="rounded-full border border-[rgba(37,99,235,0.16)] bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition-colors hover:bg-[rgba(37,99,235,0.08)]"
                  href="/portal#presupuestos"
                >
                  Ver todos
                </Link>
                <Link
                  className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
                  href={`/portal/budgets/${portal.budgets[0].id}`}
                >
                  Abrir presupuesto
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Vehiculos
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">{portal.stats.vehicles}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Ordenes activas
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">{portal.stats.openOrders}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Autoinspecciones
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {portal.stats.pendingInspections}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Listos para retiro
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">{portal.stats.readyForDelivery}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Presupuestos pendientes
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">{portal.stats.pendingBudgets}</p>
          </div>
        </div>
      </Card>

      {portal.budgets.length > 0 ? (
        <section className="space-y-4" id="presupuestos">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Presupuestos del taller
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold">
              Revision y respuesta del cliente
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {portal.budgets.map((budget) => (
              <Card className="rounded-2xl" key={budget.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {budget.budgetNumber}
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold">{budget.title}</h2>
                    <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                      {budget.vehicle.make} {budget.vehicle.model} / {budget.vehicle.plate ?? budget.vehicle.vin}
                    </p>
                  </div>
                  <BudgetStatusBadge status={budget.status} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Total
                    </p>
                    <p className="mt-2 font-heading text-xl font-semibold">
                      {formatCurrency(budget.totalAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Items
                    </p>
                    <p className="mt-2 font-heading text-xl font-semibold">{budget.items.length}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Enviado
                    </p>
                    <p className="mt-2 font-heading text-base font-semibold">
                      {formatDate(budget.sentAt ?? budget.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Link
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                    href={`/portal/budgets/${budget.id}`}
                  >
                    Ver presupuesto detallado
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {portal.vehicles.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Vehiculos registrados
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold">Tus vehiculos en taller</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {portal.vehicles.map((vehicle) => (
              <Card className="rounded-2xl" key={vehicle.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Vehiculo
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold">
                      {vehicle.make} {vehicle.model}
                    </h2>
                    <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                      {vehicle.plate ?? "Sin patente"} / VIN {vehicle.vin}
                    </p>
                  </div>
                  {vehicle.currentOrder ? <StatusBadge status={vehicle.currentOrder.status} /> : null}
                </div>

                {vehicle.currentOrder ? (
                  <div className="mt-5 space-y-4">
                    <WorkOrderProgress status={vehicle.currentOrder.status} />
                    <div className="text-sm text-[color:var(--muted-strong)]">
                      <p>
                        <span className="font-semibold text-[color:var(--foreground)]">Orden:</span>{" "}
                        {vehicle.currentOrder.orderNumber}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-[color:var(--foreground)]">
                          Motivo:
                        </span>{" "}
                        {vehicle.currentOrder.reason}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-[color:var(--foreground)]">
                          Ingreso:
                        </span>{" "}
                        {formatDate(vehicle.currentOrder.intakeDate)}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-[color:var(--foreground)]">
                          Entrega estimada:
                        </span>{" "}
                        {formatDate(vehicle.currentOrder.estimatedDate)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-[color:var(--muted)]">
                    Este vehiculo aun no tiene ordenes de trabajo registradas.
                  </p>
                )}

                <div className="mt-6 flex justify-end">
                  <Link
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                    href={`/portal/vehicles/${vehicle.id}`}
                  >
                    Ver detalle
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {portal.pendingInspections.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Casos en autoinspeccion
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold">
              Ingresos pendientes de recepcion
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {portal.pendingInspections.map((inspection) => (
              <Card className="rounded-2xl" key={inspection.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Autoinspeccion
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold">
                      {inspection.vehicleSnapshot?.make ?? "Vehiculo"}{" "}
                      {inspection.vehicleSnapshot?.model ?? "ingresado"}
                    </h2>
                    <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                      {inspection.vehicleSnapshot?.plate ?? "Sin patente"} /{" "}
                      {SELF_INSPECTION_STATUS_LABELS[inspection.status]}
                    </p>
                  </div>
                  <span className="rounded-full border border-[rgba(37,99,235,0.16)] bg-[rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                    {SELF_INSPECTION_STATUS_LABELS[inspection.status]}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
                      <span>Progreso de autoinspeccion</span>
                      <span>{inspection.progressPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(37,99,235,0.10)]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#17345e_0%,#2563eb_100%)] transition-[width]"
                        style={{ width: `${inspection.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-[color:var(--muted-strong)]">
                    <p>
                      <span className="font-semibold text-[color:var(--foreground)]">Ingreso:</span>{" "}
                      {formatDate(inspection.createdAt)}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-[color:var(--foreground)]">
                        Riesgo:
                      </span>{" "}
                      {SELF_INSPECTION_RISK_LABELS[inspection.overallRiskLevel]}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-[color:var(--foreground)]">
                        Motivo:
                      </span>{" "}
                      {inspection.mainComplaint ?? "Autoinspeccion recibida por el taller"}
                    </p>
                  </div>
                </div>

              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {portal.vehicles.length === 0 &&
      portal.pendingInspections.length === 0 &&
      portal.budgets.length === 0 ? (
        <Card className="rounded-2xl text-center">
          <p className="text-[color:var(--muted-strong)]">
            Aun no tienes vehiculos ni ingresos asociados en el portal.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
