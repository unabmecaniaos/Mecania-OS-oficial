import Link from "next/link";
import { WorkOrderStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import {
  isWorkOrderDelayed,
  WORK_ORDER_STATUS_OPTIONS,
  WORK_ORDER_STATUS_LABELS,
} from "@/modules/work-orders/work-order.constants";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { listWorkOrders } from "@/modules/work-orders/work-order.service";

type WorkOrdersPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: WorkOrderStatus;
  }>;
};

export default async function WorkOrdersPage({ searchParams }: WorkOrdersPageProps) {
  const { q, status } = await searchParams;
  const session = await getCurrentSession();
  const workOrders = await listWorkOrders({
    search: q,
    status,
    actorId: session?.user.id,
    actorRole: session?.user.role,
  });

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Nucleo operativo
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">Ordenes de trabajo</h1>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <form className="flex flex-col gap-3 md:flex-row" method="get">
              <Input defaultValue={q} name="q" placeholder="Buscar por OT, cliente, VIN o patente" />
              <Select defaultValue={status ?? ""} name="status">
                <option value="">Todos los estados</option>
                {WORK_ORDER_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary">
                Filtrar
              </Button>
            </form>
            <Link href="/work-orders/new">
              <Button>Nueva orden</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {workOrders.map((order) => {
          const isDelayed = isWorkOrderDelayed({
            status: order.status,
            promisedDate: order.estimatedDate,
          });

          return (
            <Card className="rounded-xl" key={order.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-heading text-2xl font-semibold">{order.orderNumber}</h2>
                    <StatusBadge status={order.status} />
                    {isDelayed ? (
                      <span className="rounded-full border border-[rgba(220,38,38,0.22)] bg-[rgba(220,38,38,0.10)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#b91c1c]">
                        Atrasada
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                    {order.client.fullName} / {order.vehicle.make} {order.vehicle.model}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Responsable actual: {order.assignedTechnician?.name ?? "Sin asignar"}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Fecha prometida: {formatDate(order.estimatedDate)}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{order.reason}</p>
                </div>

                <div className="flex flex-col items-start gap-2 md:items-end">
                  <p className="text-sm text-[color:var(--muted)]">
                    Ingreso {formatDate(order.intakeDate)}
                  </p>
                  <p className="text-sm text-[color:var(--muted)]">
                    Estado {WORK_ORDER_STATUS_LABELS[order.status]}
                  </p>
                  <Link className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]" href={`/work-orders/${order.id}`}>
                    Abrir orden
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}

        {workOrders.length === 0 ? (
          <Card className="rounded-xl text-center">
            <p className="text-[color:var(--muted-strong)]">
              No hay ordenes de trabajo con esos filtros.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

