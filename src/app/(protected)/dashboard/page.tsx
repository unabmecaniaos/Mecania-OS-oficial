import Link from "next/link";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { getDashboardSummary } from "@/modules/dashboard/dashboard.service";

const stats = [
  { key: "clients", label: "Clientes" },
  { key: "vehicles", label: "Vehiculos" },
  { key: "activeOrders", label: "Ordenes activas" },
  { key: "awaitingApproval", label: "Esperando aprobacion" },
] as const;

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const summary = await getDashboardSummary({
    actorId: session?.user.id,
    actorRole: session?.user.role,
  });

  return (
    <div className="space-y-6">
      <section className="data-grid">
        {stats.map((stat) => (
          <Card className="rounded-xl" key={stat.key}>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              {stat.label}
            </p>
            <p className="mt-5 font-heading text-4xl font-semibold text-[color:var(--foreground)]">
              {summary[stat.key]}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Ordenes recientes
              </p>
              <h3 className="mt-2 font-heading text-2xl font-semibold">Operacion en curso</h3>
            </div>

            <Link href="/work-orders/new">
              <Button>Nueva orden</Button>
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {summary.latestOrders.map((order) => (
              <div
                className="flex flex-col gap-4 rounded-lg border border-[color:var(--border)] bg-white/[0.65] p-4 md:flex-row md:items-center md:justify-between"
                key={order.id}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {order.orderNumber}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                    {order.client.fullName} / {order.vehicle.make} {order.vehicle.model}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Responsable actual: {order.assignedTechnician?.name ?? "Sin asignar"}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{order.reason}</p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-sm text-[color:var(--muted)]">
                    Ingreso {formatDate(order.intakeDate)}
                  </p>
                  <Link className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]" href={`/work-orders/${order.id}`}>
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
          <h3 className="mt-2 font-heading text-2xl font-semibold">Semaforo operativo</h3>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-[#d7e3f4] bg-[#f3f7fd] p-5">
              <p className="text-sm text-[color:var(--muted-strong)]">Ordenes esperando aprobacion</p>
              <p className="mt-2 font-heading text-4xl font-semibold text-[#2563eb]">
                {summary.awaitingApproval}
              </p>
            </div>
            <div className="rounded-lg border border-[#dbe4ef] bg-[#f8fafc] p-5">
              <p className="text-sm text-[color:var(--muted-strong)]">Listas para entrega</p>
              <p className="mt-2 font-heading text-4xl font-semibold text-[#334155]">
                {summary.readyForDelivery}
              </p>
            </div>
            <div className="rounded-lg border border-[rgba(220,38,38,0.18)] bg-[rgba(220,38,38,0.08)] p-5">
              <p className="text-sm text-[#b91c1c]">Ordenes atrasadas</p>
              <p className="mt-2 font-heading text-4xl font-semibold text-[#b91c1c]">
                {summary.overdueOrders}
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

