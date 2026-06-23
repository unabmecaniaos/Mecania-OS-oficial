import Link from "next/link";
import { UserRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { getDashboardSummary } from "@/modules/dashboard/dashboard.service";
import { WORK_ORDER_SERVICE_FLOW_SHORT_LABELS } from "@/modules/work-orders/work-order.constants";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const summary = await getDashboardSummary({
    actorId: session?.user.id,
    actorRole: session?.user.role,
  });
  const maxWorkload = Math.max(
    1,
    ...summary.mechanicWorkload.map((mechanic) => mechanic.totalOrders),
  );
  const maxRevenue = Math.max(1, ...summary.financial.monthlyTrend.map((month) => month.amount));

  return (
    <div className="space-y-5">
      <Card className="rounded-[22px] bg-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Dashboard
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">
              Bienvenido, {session?.user.name}
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <Link href="/clients/new">
              <Button className="w-full sm:w-auto">Nuevo cliente</Button>
            </Link>
            <Link href="/clients">
              <Button className="w-full sm:w-auto" variant="secondary">
                Ver clientes
              </Button>
            </Link>
            {session?.user.role === UserRole.ADMIN || session?.user.role === UserRole.MECHANIC ? (
              <Link href="/time-off">
                <Button className="w-full sm:w-auto" variant="secondary">
                  Permisos
                </Button>
              </Link>
            ) : null}
            {session?.user.role === UserRole.ADMIN ? (
              <>
                <Link href="/payroll">
                  <Button className="w-full sm:w-auto" variant="secondary">
                    Pagos
                  </Button>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="rounded-2xl border-[rgba(22,163,74,0.16)] bg-[linear-gradient(180deg,rgba(240,253,244,0.95),rgba(255,255,255,0.95))]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <SectionHeader eyebrow="Finanzas" title="Ingresos aprobados" />
            <div className="rounded-xl border border-[rgba(22,163,74,0.18)] bg-white/80 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#166534]">Mes actual</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-[#14532d]">
                {formatCurrency(summary.financial.monthlyRevenueGross)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <SmallMetric label="Neto" value={formatCurrency(summary.financial.monthlyRevenueNet)} />
              <SmallMetric label="IVA" value={formatCurrency(summary.financial.monthlyRevenueTax)} />
              <SmallMetric
                label="Total historico"
                value={formatCurrency(summary.financial.totalApprovedRevenue)}
              />
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-white/85 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  Ultimos 6 meses
                </p>
                <p className="text-xs text-[color:var(--muted)]">
                  Comparativo por fecha de presupuesto
                </p>
              </div>
              <div className="mt-4 flex h-48 items-end gap-3">
                {summary.financial.monthlyTrend.map((month) => {
                  const percent = Math.max(6, Math.round((month.amount / maxRevenue) * 100));

                  return (
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={month.key}>
                      <div className="flex h-36 w-full items-end rounded-lg bg-[rgba(22,163,74,0.08)] px-2">
                        <div
                          className="w-full rounded-t-md bg-[#16a34a]"
                          style={{ height: `${percent}%` }}
                        />
                      </div>
                      <p className="truncate text-xs font-semibold capitalize text-[color:var(--foreground)]">
                        {month.label}
                      </p>
                      <p className="truncate text-[11px] text-[color:var(--muted)]">
                        {formatCurrency(month.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            "rounded-2xl",
            summary.overdueOrders > 0 &&
              "border-[rgba(220,38,38,0.18)] bg-[linear-gradient(180deg,rgba(254,242,242,0.96),rgba(255,255,255,0.95))]",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <SectionHeader eyebrow="Alertas" title="Ordenes atrasadas" />
            <p
              className={cn(
                "font-heading text-4xl font-semibold text-[color:var(--foreground)]",
                summary.overdueOrders > 0 && "text-[#b91c1c]",
              )}
            >
              {summary.overdueOrders}
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {summary.overdueOrderList.map((order) => (
              <Link className="block" href={`/work-orders/${order.id}`} key={order.id}>
                <div className="rounded-xl border border-[rgba(220,38,38,0.16)] bg-white/85 p-3 text-sm transition hover:border-[#dc2626]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[color:var(--foreground)]">{order.orderNumber}</p>
                    <span className="rounded-md bg-[#fef2f2] px-2 py-1 text-[11px] font-semibold text-[#b91c1c]">
                      Atrasada
                    </span>
                  </div>
                  <p className="mt-1 text-[color:var(--muted-strong)]">
                    {order.vehicle.make} {order.vehicle.model} /{" "}
                    {order.vehicle.plate ?? order.vehicle.vin}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    Responsable:{" "}
                    {order.assignedTechnician?.name ?? order.assignedPainter?.name ?? "Sin asignar"}
                  </p>
                </div>
              </Link>
            ))}

            {summary.overdueOrderList.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                No hay ordenes atrasadas con fecha comprometida.
              </p>
            ) : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Ordenes activas" value={summary.activeOrders} />
        <KpiTile label="Autos registrados" value={summary.vehicles} />
        <KpiTile label="Clientes" value={summary.clients} />
        <KpiTile label="Esperando aprobacion" value={summary.awaitingApproval} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <Card className="rounded-2xl">
            <SectionHeader eyebrow="Operacion" title="Estado del taller" />

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <OperationTile label="Mecanica" value={summary.operational.mechanicsInProcess} />
              <OperationTile label="Pintura" tone="paint" value={summary.operational.paintInProcess} />
              <OperationTile
                label="Listos para retiro"
                tone="ready"
                value={summary.operational.readyForDelivery}
              />
            </div>
          </Card>

          <Card className="rounded-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <SectionHeader eyebrow="Ordenes recientes" title="Operacion en curso" />
              <Link href="/work-orders">
                <Button className="w-full md:w-auto" variant="secondary">
                  Abrir listado
                </Button>
              </Link>
            </div>

            <div className="mt-5 divide-y divide-[color:var(--border)]">
              {summary.latestOrders.map((order) => (
                <div
                  className="grid gap-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center"
                  key={order.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-[color:var(--foreground)]">
                        {order.orderNumber}
                      </p>
                      <StatusBadge status={order.status} />
                      <span className="rounded-md bg-[color:var(--surface-strong)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-strong)]">
                        {WORK_ORDER_SERVICE_FLOW_SHORT_LABELS[order.serviceFlow]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                      {order.client.fullName} / {order.vehicle.make} {order.vehicle.model}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Mecanica: {order.assignedTechnician?.name ?? "Sin asignar"} / Pintura:{" "}
                      {order.assignedPainter?.name ?? "Sin asignar"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                    <p className="text-sm text-[color:var(--muted)]">
                      {formatDate(order.intakeDate)}
                    </p>
                    <Link
                      className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                      href={`/work-orders/${order.id}`}
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              ))}

              {summary.latestOrders.length === 0 ? (
                <p className="py-4 text-sm text-[color:var(--muted)]">
                  No hay ordenes recientes.
                </p>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-2xl">
            <SectionHeader eyebrow="Carga por mecanico" title="Distribucion activa" />

            <div className="mt-5 space-y-5">
              {summary.mechanicWorkload.map((mechanic) => {
                const percent = Math.round((mechanic.totalOrders / maxWorkload) * 100);

                return (
                  <div className="space-y-2" key={mechanic.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[color:var(--foreground)]">
                          {mechanic.name}
                        </p>
                        <p className="truncate text-xs text-[color:var(--muted)]">
                          {mechanic.email}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[color:var(--foreground)]">
                        {mechanic.totalOrders} OT
                      </p>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[color:var(--surface-strong)]">
                      <div
                        className="h-full rounded-full bg-[#2563eb]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="rounded-md bg-[rgba(37,99,235,0.10)] px-2 py-1 text-[#1d4ed8]">
                        Mecanica {mechanic.mechanicalOrders}
                      </span>
                      <span className="rounded-md bg-[rgba(200,92,42,0.10)] px-2 py-1 text-[color:var(--accent-strong)]">
                        Pintura {mechanic.paintOrders}
                      </span>
                    </div>
                  </div>
                );
              })}

              {summary.mechanicWorkload.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">No hay mecanicos activos.</p>
              ) : null}
            </div>
          </Card>

          <Card
            className={cn(
              "rounded-2xl",
              summary.inventory.lowStockCount > 0 &&
                "border-[rgba(220,38,38,0.18)] bg-[rgba(220,38,38,0.05)]",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <SectionHeader eyebrow="Inventario" title="Stock bajo" />
              <p
                className={cn(
                  "font-heading text-3xl font-semibold text-[color:var(--foreground)]",
                  summary.inventory.lowStockCount > 0 && "text-[#b91c1c]",
                )}
              >
                {summary.inventory.lowStockCount}
              </p>
            </div>

            <div className="mt-5 space-y-2">
              {summary.inventory.lowStockParts.map((part) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-white/75 px-3 py-2 text-sm"
                  key={part.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[color:var(--foreground)]">{part.name}</p>
                    <p className="truncate text-xs text-[color:var(--muted)]">{part.code}</p>
                  </div>
                  <span className="shrink-0 font-semibold">
                    {part.currentStock}/{part.minimumStock}
                  </span>
                </div>
              ))}

              {summary.inventory.lowStockParts.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">Sin alertas de stock minimo.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">{eyebrow}</p>
      <h2 className="mt-2 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
        {title}
      </h2>
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-xl">
      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-4 font-heading text-3xl font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </Card>
  );
}

function OperationTile({
  label,
  tone = "mechanics",
  value,
}: {
  label: string;
  tone?: "mechanics" | "paint" | "ready";
  value: number;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        tone === "mechanics" && "border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.06)]",
        tone === "paint" && "border-[rgba(200,92,42,0.16)] bg-[rgba(200,92,42,0.06)]",
        tone === "ready" && "border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.06)]",
      )}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-3 font-heading text-3xl font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
