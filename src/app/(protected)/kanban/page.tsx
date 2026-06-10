import Link from "next/link";
import { UserRole, WorkOrderAreaStatus, WorkOrderStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";
import {
  isWorkOrderDelayed,
  WORK_ORDER_SERVICE_FLOW_SHORT_LABELS,
} from "@/modules/work-orders/work-order.constants";

const kanbanColumns = [
  {
    id: "inspection",
    title: "Inspeccion",
    marker: "IN",
    accent: "border-l-[#2563eb]",
  },
  {
    id: "bodywork",
    title: "Desabolladura",
    marker: "DE",
    accent: "border-l-[#f97316]",
  },
  {
    id: "preparation",
    title: "Preparacion",
    marker: "PR",
    accent: "border-l-[#9333ea]",
  },
  {
    id: "paint",
    title: "Pintura",
    marker: "PI",
    accent: "border-l-[#ea580c]",
  },
  {
    id: "polish",
    title: "Pulido",
    marker: "PU",
    accent: "border-l-[#475569]",
  },
  {
    id: "delivery",
    title: "Entrega",
    marker: "EN",
    accent: "border-l-[#16a34a]",
  },
] as const;

type KanbanColumnId = (typeof kanbanColumns)[number]["id"];

function getKanbanColumn(order: {
  status: WorkOrderStatus;
  paintStatus: WorkOrderAreaStatus;
  mechanicsStatus: WorkOrderAreaStatus;
}) {
  if (order.status === WorkOrderStatus.READY_FOR_DELIVERY) {
    return "delivery";
  }

  if (order.status === WorkOrderStatus.IN_PAINT || order.paintStatus === WorkOrderAreaStatus.IN_PROGRESS) {
    return "paint";
  }

  if (order.paintStatus === WorkOrderAreaStatus.COMPLETED) {
    return "polish";
  }

  if (order.status === WorkOrderStatus.WAITING_APPROVAL || order.status === WorkOrderStatus.WAITING_PARTS) {
    return "preparation";
  }

  if (order.status === WorkOrderStatus.IN_REPAIR || order.mechanicsStatus === WorkOrderAreaStatus.IN_PROGRESS) {
    return "bodywork";
  }

  return "inspection";
}

export default async function KanbanPage() {
  const session = await getCurrentSession();
  const scope =
    session?.user.role === UserRole.MECHANIC
      ? {
          OR: [
            {
              assignedTechnicianId: session.user.id,
            },
            {
              assignedPainterId: session.user.id,
            },
          ],
        }
      : {};
  const orders = await prisma.workOrder.findMany({
    where: {
      deletedAt: null,
      status: {
        notIn: [WorkOrderStatus.DELIVERED, WorkOrderStatus.CANCELLED],
      },
      ...scope,
    },
    include: {
      client: true,
      vehicle: true,
      assignedTechnician: true,
      assignedPainter: true,
    },
    orderBy: [{ estimatedDate: "asc" }, { intakeDate: "desc" }],
  });
  const groupedOrders = kanbanColumns.reduce(
    (accumulator, column) => ({
      ...accumulator,
      [column.id]: orders.filter((order) => getKanbanColumn(order) === column.id),
    }),
    {} as Record<KanbanColumnId, typeof orders>,
  );

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">
            Kanban operativo
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Visualiza cada vehiculo por etapa, responsable y fecha comprometida.
          </p>
        </div>

        <Link href="/work-orders/new">
          <Button className="w-full sm:w-auto">Nueva orden</Button>
        </Link>
      </section>

      <div className="grid gap-4 xl:grid-cols-6">
        {kanbanColumns.map((column) => {
          const columnOrders = groupedOrders[column.id] ?? [];

          return (
            <section
              className="min-h-[620px] rounded-2xl border border-[color:var(--border)] bg-[rgba(226,236,247,0.62)] p-4"
              key={column.id}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-bold text-[color:var(--muted-strong)] shadow-sm">
                    {column.marker}
                  </span>
                  <h2 className="truncate text-lg font-semibold text-[color:var(--foreground)]">
                    {column.title}
                  </h2>
                </div>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dbe7f3] text-sm font-semibold text-[color:var(--muted-strong)]">
                  {columnOrders.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {columnOrders.map((order) => {
                  const delayed = isWorkOrderDelayed({
                    status: order.status,
                    promisedDate: order.estimatedDate,
                  });

                  return (
                    <Link className="block" href={`/work-orders/${order.id}`} key={order.id}>
                      <article
                        className={cn(
                          "rounded-xl border border-[color:var(--border)] border-l-4 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)]",
                          column.accent,
                          delayed && "border-l-[#dc2626]",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[color:var(--foreground)]">
                              {order.vehicle.plate ?? order.vehicle.vin}
                            </p>
                            <p className="mt-1 truncate text-sm text-[color:var(--muted-strong)]">
                              {order.vehicle.make} {order.vehicle.model}
                            </p>
                          </div>
                          <span className="rounded-md bg-[#e8f0ff] px-2 py-1 text-[11px] font-semibold text-[#1d4ed8]">
                            {WORK_ORDER_SERVICE_FLOW_SHORT_LABELS[order.serviceFlow]}
                          </span>
                        </div>
                        <p className="mt-3 truncate text-sm text-[color:var(--muted-strong)]">
                          {order.client.fullName}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[color:var(--border)] pt-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs text-[color:var(--muted)]">
                              {order.assignedTechnician?.name ??
                                order.assignedPainter?.name ??
                                "Sin responsable"}
                            </p>
                            <p className="mt-1 text-xs text-[color:var(--muted)]">
                              {order.estimatedDate
                                ? `Entrega ${formatDate(order.estimatedDate)}`
                                : "Sin fecha"}
                            </p>
                          </div>
                          {delayed ? (
                            <span className="rounded-md bg-[#fef2f2] px-2 py-1 text-[11px] font-semibold text-[#b91c1c]">
                              Atrasada
                            </span>
                          ) : (
                            <StatusBadge status={order.status} />
                          )}
                        </div>
                      </article>
                    </Link>
                  );
                })}

                {columnOrders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--border-strong)] bg-white/55 p-4 text-sm text-[color:var(--muted)]">
                    Sin vehiculos en esta etapa.
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
