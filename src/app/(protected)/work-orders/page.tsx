import Link from "next/link";
import { WorkOrderStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import {
  WORK_ORDER_STATUS_OPTIONS,
  WORK_ORDER_STATUS_LABELS,
} from "@/modules/work-orders/work-order.constants";
import { listWorkOrders } from "@/modules/work-orders/work-order.service";

type WorkOrdersPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: WorkOrderStatus;
  }>;
};

export default async function WorkOrdersPage({ searchParams }: WorkOrdersPageProps) {
  const { q, status } = await searchParams;
  const workOrders = await listWorkOrders({
    search: q,
    status,
  });
  const waitingApproval = workOrders.filter(
    (order) => order.status === WorkOrderStatus.WAITING_APPROVAL,
  ).length;
  const inProgress = workOrders.filter(
    (order) =>
      order.status === WorkOrderStatus.IN_DIAGNOSIS ||
      order.status === WorkOrderStatus.IN_REPAIR ||
      order.status === WorkOrderStatus.WAITING_PARTS,
  ).length;

  return (
    <div className="space-y-6">
      <Card className="rounded-[22px]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Nucleo operativo
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-white">
              Ordenes de trabajo
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted-strong)]">
              Seguimiento del trabajo activo, aprobaciones pendientes y trazabilidad del taller.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-[620px]">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.6)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Ordenes
                </p>
                <p className="mt-3 font-heading text-3xl font-semibold text-white">
                  {workOrders.length}
                </p>
              </div>
              <div className="rounded-[18px] border border-[rgba(210,167,44,0.22)] bg-[rgba(210,167,44,0.1)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">
                  Por aprobar
                </p>
                <p className="mt-3 font-heading text-3xl font-semibold text-[color:var(--warning)]">
                  {waitingApproval}
                </p>
              </div>
              <div className="rounded-[18px] border border-[rgba(76,195,255,0.22)] bg-[rgba(76,195,255,0.1)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">
                  En proceso
                </p>
                <p className="mt-3 font-heading text-3xl font-semibold text-[color:var(--info)]">
                  {inProgress}
                </p>
              </div>
            </div>

            <form className="flex flex-col gap-3 md:flex-row" method="get">
              <Input
                className="flex-1"
                defaultValue={q}
                name="q"
                placeholder="Buscar por OT, cliente, VIN o patente"
              />
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
              <Link href="/work-orders/new">
                <Button>Nueva orden</Button>
              </Link>
            </form>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {workOrders.map((order) => (
          <Card className="rounded-[20px] p-5" key={order.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-heading text-2xl font-semibold text-white">
                    {order.orderNumber}
                  </h2>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                  {order.client.fullName} / {order.vehicle.make} {order.vehicle.model}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{order.reason}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:min-w-[360px]">
                <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.64)] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    Ingreso
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {formatDate(order.intakeDate)}
                  </p>
                </div>
                <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.64)] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    Estado
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {WORK_ORDER_STATUS_LABELS[order.status]}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-[color:var(--border)] pt-4">
              <div className="rounded-full border border-[rgba(55,168,255,0.24)] bg-[rgba(55,168,255,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                OT activa
              </div>
              <Link
                className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accent-strong)]"
                href={`/work-orders/${order.id}`}
              >
                  Abrir orden
              </Link>
            </div>
          </Card>
        ))}

        {workOrders.length === 0 ? (
          <Card className="rounded-[20px] p-8 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Sin resultados
            </p>
            <p className="mt-3 text-[color:var(--muted-strong)]">
              No hay ordenes de trabajo con esos filtros.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

