import Link from "next/link";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getDashboardSummary } from "@/modules/dashboard/dashboard.service";

const stats = [
  { key: "clients", label: "Clientes" },
  { key: "vehicles", label: "Vehiculos" },
  { key: "activeOrders", label: "Ordenes activas" },
  { key: "awaitingApproval", label: "Esperando aprobacion" },
] as const;

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="space-y-6">
      <section className="data-grid">
        {stats.map((stat) => (
          <Card className="rounded-[18px] p-5" key={stat.key}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  {stat.label}
                </p>
                <p className="mt-4 font-heading text-4xl font-semibold text-white">
                  {summary[stat.key]}
                </p>
              </div>
              <span className="rounded-full border border-[rgba(55,168,255,0.2)] bg-[rgba(55,168,255,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                Hoy
              </span>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="rounded-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Ordenes recientes
              </p>
              <h3 className="mt-2 font-heading text-2xl font-semibold text-white">
                Operacion en curso
              </h3>
            </div>

            <Link href="/work-orders/new">
              <Button>Nueva orden</Button>
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {summary.latestOrders.map((order) => (
              <div
                className="flex flex-col gap-4 rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.72)] p-4 md:flex-row md:items-center md:justify-between"
                key={order.id}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-white">
                      {order.orderNumber}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                    {order.client.fullName} / {order.vehicle.make} {order.vehicle.model}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{order.reason}</p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-sm text-[color:var(--muted)]">
                    Ingreso {formatDate(order.intakeDate)}
                  </p>
                  <Link
                    className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accent-strong)]"
                    href={`/work-orders/${order.id}`}
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Foco de hoy
          </p>
          <h3 className="mt-2 font-heading text-2xl font-semibold text-white">
            Semaforo operativo
          </h3>

          <div className="mt-6 space-y-4">
            <div className="rounded-[18px] border border-[rgba(210,167,44,0.2)] bg-[rgba(210,167,44,0.1)] p-5">
              <p className="text-sm text-[color:var(--muted-strong)]">Ordenes esperando aprobacion</p>
              <p className="mt-2 font-heading text-4xl font-semibold text-[color:var(--warning)]">
                {summary.awaitingApproval}
              </p>
            </div>
            <div className="rounded-[18px] border border-[rgba(35,193,107,0.2)] bg-[rgba(35,193,107,0.1)] p-5">
              <p className="text-sm text-[color:var(--muted-strong)]">Listas para entrega</p>
              <p className="mt-2 font-heading text-4xl font-semibold text-[color:var(--success)]">
                {summary.readyForDelivery}
              </p>
            </div>

            <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.58)] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Prioridad de turno
              </p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
                Mantener aprobaciones y entregas visibles reduce tiempos muertos y mejora el flujo
                del taller durante la jornada.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

