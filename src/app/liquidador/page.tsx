import Link from "next/link";

import { BudgetStatusBadge } from "@/modules/budgets/budget-status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getLiquidatorPortalOverview } from "@/modules/insurance-cases/insurance-case.service";

export default async function LiquidatorPortalPage() {
  const portal = await getLiquidatorPortalOverview();

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Portal de aseguradora
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">
              Casos asignados a {portal.liquidator.name}
            </h1>
          </div>

          <Link href="/liquidador/new">
            <Button>Registrar siniestro</Button>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Casos
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">{portal.stats.totalCases}</p>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Presupuestos pendientes
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {portal.stats.pendingBudgets}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              En reparacion
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {portal.stats.activeRepairs}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Listos
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">{portal.stats.readyCases}</p>
          </div>
        </div>
      </Card>

      <section className="space-y-4" id="casos-pendientes">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Seguimiento integral
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">Mis siniestros</h2>
        </div>

        {portal.cases.length === 0 ? (
          <Card className="rounded-2xl">
            <p className="text-sm text-[color:var(--muted)]">Todavia no tienes casos asignados.</p>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {portal.cases.map((insuranceCase) => (
              <Card className="rounded-2xl" key={insuranceCase.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {insuranceCase.caseNumber}
                    </p>
                    <h3 className="mt-2 font-heading text-2xl font-semibold">
                      {insuranceCase.vehicle.make} {insuranceCase.vehicle.model}
                    </h3>
                    <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                      {insuranceCase.ownerFullName} /{" "}
                      {insuranceCase.vehicle.plate ?? insuranceCase.vehicle.vin}
                    </p>
                  </div>
                  <span className="rounded-full border border-[rgba(37,99,235,0.16)] bg-[rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                    {insuranceCase.stageLabel}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Choque
                    </p>
                    <p className="mt-2 font-semibold">{formatDate(insuranceCase.incidentDate)}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Presupuesto
                    </p>
                    <div className="mt-2">
                      {insuranceCase.latestBudget ? (
                        <BudgetStatusBadge status={insuranceCase.latestBudget.status} />
                      ) : (
                        <span className="text-sm text-[color:var(--muted)]">Pendiente</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      Monto
                    </p>
                    <p className="mt-2 font-semibold">
                      {insuranceCase.latestBudget
                        ? formatCurrency(insuranceCase.latestBudget.totalAmount)
                        : "-"}
                    </p>
                  </div>
                </div>

                {insuranceCase.currentWorkOrder ? (
                  <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={insuranceCase.currentWorkOrder.status} />
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">
                        {insuranceCase.currentWorkOrder.orderNumber}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 flex justify-end">
                  <Link
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                    href={`/liquidador/cases/${insuranceCase.id}`}
                  >
                    Ver caso completo
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
