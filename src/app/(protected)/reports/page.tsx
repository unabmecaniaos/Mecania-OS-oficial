import { BudgetStatus, UserRole, WorkOrderStatus } from "@prisma/client";

import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  isWorkOrderDelayed,
  WORK_ORDER_STATUS_LABELS,
} from "@/modules/work-orders/work-order.constants";

const APPROVED_BUDGET_STATUSES: BudgetStatus[] = [
  BudgetStatus.APPROVED,
  BudgetStatus.PARTIALLY_APPROVED,
  BudgetStatus.CONVERTED_TO_WORK_ORDER,
];
const DECISION_BUDGET_STATUSES = [...APPROVED_BUDGET_STATUSES, BudgetStatus.REJECTED];
const STAGE_LABELS = ["Inspeccion", "Desabolladura", "Preparacion", "Pintura", "Pulido"];
const PIE_COLORS = ["#2563eb", "#ec4899", "#6366f1", "#10b981", "#f97316", "#64748b"];

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, months: number) {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

function monthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(value: Date) {
  return value.toLocaleDateString("es-CL", { month: "short" });
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatPercentChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? "+100%" : "0%";
  }

  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? "+" : ""}${change}%`;
}

function getStatusStage(status: WorkOrderStatus) {
  if (status === WorkOrderStatus.IN_REPAIR) {
    return "Desabolladura";
  }

  if (status === WorkOrderStatus.WAITING_APPROVAL || status === WorkOrderStatus.WAITING_PARTS) {
    return "Preparacion";
  }

  if (status === WorkOrderStatus.IN_PAINT) {
    return "Pintura";
  }

  if (status === WorkOrderStatus.READY_FOR_DELIVERY || status === WorkOrderStatus.DELIVERED) {
    return "Pulido";
  }

  return "Inspeccion";
}

async function getReportsData() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const previousMonthStart = addMonths(monthStart, -1);
  const chartStart = addMonths(monthStart, -2);
  const months = Array.from({ length: 3 }, (_, index) => addMonths(chartStart, index));
  const [orders, mechanics, budgets] = await Promise.all([
    prisma.workOrder.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        client: true,
        vehicle: true,
        assignedTechnician: true,
        assignedPainter: true,
        insuranceCase: {
          include: {
            liquidator: true,
          },
        },
        statusLogs: {
          orderBy: {
            changedAt: "asc",
          },
        },
      },
      orderBy: {
        intakeDate: "desc",
      },
    }),
    prisma.user.findMany({
      where: {
        role: UserRole.MECHANIC,
        active: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.budget.findMany({
      where: {
        deletedAt: null,
        status: {
          in: DECISION_BUDGET_STATUSES,
        },
      },
      select: {
        status: true,
        createdAt: true,
      },
    }),
  ]);
  const currentMonthOrders = orders.filter((order) => order.intakeDate >= monthStart);
  const previousMonthOrders = orders.filter(
    (order) => order.intakeDate >= previousMonthStart && order.intakeDate < monthStart,
  );
  const closedThisMonth = orders.filter(
    (order) => order.closedDate && order.closedDate >= monthStart,
  );
  const averageDays =
    closedThisMonth.length > 0
      ? closedThisMonth.reduce(
          (sum, order) => sum + daysBetween(order.intakeDate, order.closedDate ?? now),
          0,
        ) / closedThisMonth.length
      : currentMonthOrders.reduce((sum, order) => sum + daysBetween(order.intakeDate, now), 0) /
        Math.max(1, currentMonthOrders.length);
  const currentDecisionBudgets = budgets.filter((budget) => budget.createdAt >= monthStart);
  const approvedBudgets = currentDecisionBudgets.filter((budget) =>
    APPROVED_BUDGET_STATUSES.includes(budget.status),
  ).length;
  const approvalRate =
    currentDecisionBudgets.length > 0
      ? Math.round((approvedBudgets / currentDecisionBudgets.length) * 100)
      : 0;
  const monthCounts = months.map((month) => ({
    key: monthKey(month),
    label: monthLabel(month),
    value: orders.filter((order) => {
      const nextMonth = addMonths(month, 1);
      return order.intakeDate >= month && order.intakeDate < nextMonth;
    }).length,
  }));
  const stageHours = new Map(STAGE_LABELS.map((label) => [label, { total: 0, count: 0 }]));

  for (const order of orders) {
    const logs = order.statusLogs;

    if (logs.length === 0) {
      const stage = getStatusStage(order.status);
      const bucket = stageHours.get(stage);

      if (bucket) {
        bucket.total += daysBetween(order.intakeDate, order.closedDate ?? now) * 24;
        bucket.count += 1;
      }

      continue;
    }

    logs.forEach((log, index) => {
      const nextDate = logs[index + 1]?.changedAt ?? order.closedDate ?? now;
      const stage = getStatusStage(log.nextStatus);
      const bucket = stageHours.get(stage);

      if (bucket) {
        bucket.total += daysBetween(log.changedAt, nextDate) * 24;
        bucket.count += 1;
      }
    });
  }

  const stageAverages = STAGE_LABELS.map((label) => {
    const bucket = stageHours.get(label);
    return {
      label,
      value: bucket && bucket.count > 0 ? Math.round(bucket.total / bucket.count) : 0,
    };
  });
  const productivity = mechanics.map((mechanic) => {
    const total = currentMonthOrders.filter(
      (order) =>
        order.assignedTechnicianId === mechanic.id || order.assignedPainterId === mechanic.id,
    ).length;

    return {
      name: mechanic.name,
      total,
    };
  });
  const insurerCounts = new Map<string, number>();

  for (const order of currentMonthOrders) {
    const name = order.insuranceCase?.liquidator.name ?? "Particulares";
    insurerCounts.set(name, (insurerCounts.get(name) ?? 0) + 1);
  }

  const insurerDistribution = Array.from(insurerCounts.entries()).map(([name, total], index) => ({
    name,
    total,
    color: PIE_COLORS[index % PIE_COLORS.length],
  }));
  const delayedOrders = orders
    .filter((order) =>
      isWorkOrderDelayed({
        status: order.status,
        promisedDate: order.estimatedDate,
      }),
    )
    .slice(0, 5)
    .map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      clientName: order.client.fullName,
      vehicleLabel: `${order.vehicle.make} ${order.vehicle.model}`,
      stage: WORK_ORDER_STATUS_LABELS[order.status],
      daysLate: order.estimatedDate ? Math.ceil(daysBetween(order.estimatedDate, now)) : 0,
      responsible: order.assignedTechnician?.name ?? order.assignedPainter?.name ?? "Sin asignar",
    }));

  return {
    totalJobsMonth: currentMonthOrders.length,
    jobsChange: formatPercentChange(currentMonthOrders.length, previousMonthOrders.length),
    averageDays,
    mechanicsActive: mechanics.length,
    approvalRate,
    monthCounts,
    stageAverages,
    productivity,
    insurerDistribution,
    delayedOrders,
  };
}

export default async function ReportsPage() {
  const report = await getReportsData();
  const maxStage = Math.max(1, ...report.stageAverages.map((item) => item.value));
  const maxMonth = Math.max(1, ...report.monthCounts.map((item) => item.value));
  const maxProductivity = Math.max(1, ...report.productivity.map((item) => item.total));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">
            Reportes
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Indicadores de productividad, aprobacion y atrasos operativos.
          </p>
        </div>

        <div className="rounded-xl border border-[#d7e0ec] bg-[#f8fbff] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Trabajos del mes
          </p>
          <p className="mt-2 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
            {report.totalJobsMonth}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportMetric
          label="Total trabajos (mes)"
          meta={`${report.jobsChange} vs mes anterior`}
          tone={report.jobsChange.startsWith("-") ? "danger" : "success"}
          value={String(report.totalJobsMonth)}
        />
        <ReportMetric
          label="Tiempo promedio"
          meta="Cierre o permanencia actual"
          tone="danger"
          value={`${report.averageDays.toFixed(1)}d`}
        />
        <ReportMetric
          label="Tecnicos activos"
          meta="Equipo disponible"
          tone="success"
          value={String(report.mechanicsActive)}
        />
        <ReportMetric
          label="Tasa aprobacion"
          meta="Presupuestos con decision"
          tone="info"
          value={`${report.approvalRate}%`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[22px] bg-white">
          <ChartTitle title="Tiempo promedio por etapa" />
          <div className="mt-6 flex h-72 items-end gap-5 border-b border-l border-dashed border-[#dbe5f3] px-5">
            {report.stageAverages.map((stage) => (
              <div className="flex min-w-0 flex-1 flex-col items-center gap-3" key={stage.label}>
                <div className="flex h-56 w-full items-end justify-center">
                  <div
                    className="w-full max-w-[110px] rounded-t-xl bg-[#3b82f6]"
                    style={{ height: `${Math.max(8, (stage.value / maxStage) * 100)}%` }}
                  />
                </div>
                <p className="truncate text-xs text-[color:var(--muted-strong)]">{stage.label}</p>
                <p className="text-xs font-semibold text-[color:var(--foreground)]">
                  {stage.value}h
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[22px] bg-white">
          <ChartTitle title="Trabajos por mes" />
          <MonthlyLineChart max={maxMonth} points={report.monthCounts} />
        </Card>

        <Card className="rounded-[22px] bg-white">
          <ChartTitle title="Productividad por tecnico" />
          <div className="mt-6 space-y-4">
            {report.productivity.map((mechanic) => (
              <div className="grid gap-3 sm:grid-cols-[160px_1fr_40px] sm:items-center" key={mechanic.name}>
                <p className="truncate text-sm text-[color:var(--muted-strong)]">{mechanic.name}</p>
                <div className="h-8 overflow-hidden rounded-lg bg-[color:var(--surface-strong)]">
                  <div
                    className="h-full rounded-lg bg-[#10b981]"
                    style={{ width: `${Math.max(4, (mechanic.total / maxProductivity) * 100)}%` }}
                  />
                </div>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  {mechanic.total}
                </p>
              </div>
            ))}

            {report.productivity.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">No hay tecnicos activos.</p>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-[22px] bg-white">
          <ChartTitle title="Trabajos por aseguradora" />
          <InsurancePieChart items={report.insurerDistribution} />
        </Card>

        <Card className="rounded-[22px] bg-white xl:col-span-2">
          <ChartTitle title="Vehiculos en atraso" />
          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {report.delayedOrders.map((order) => (
              <div
                className="rounded-xl border border-[rgba(220,38,38,0.18)] bg-[#fef2f2] p-4"
                key={order.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                      {order.clientName} / {order.vehicleLabel}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Etapa: {order.stage}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Responsable: {order.responsible}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#dc2626] px-3 py-1 text-sm font-semibold text-white">
                    {order.daysLate} dias
                  </span>
                </div>
              </div>
            ))}

            {report.delayedOrders.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                No hay vehiculos atrasados con fecha prometida vencida.
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}

function ReportMetric({
  label,
  meta,
  tone,
  value,
}: {
  label: string;
  meta: string;
  tone: "success" | "danger" | "info";
  value: string;
}) {
  return (
    <Card className="rounded-[22px] bg-white">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[color:var(--muted-strong)]">{label}</p>
          <p className="mt-3 font-heading text-3xl font-semibold text-[color:var(--foreground)]">
            {value}
          </p>
          <p
            className={cn(
              "mt-2 text-sm",
              tone === "success" && "text-[#16a34a]",
              tone === "danger" && "text-[#f97316]",
              tone === "info" && "text-[#2563eb]",
            )}
          >
            {meta}
          </p>
        </div>
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-semibold",
            tone === "success" && "bg-[#dcfce7] text-[#16a34a]",
            tone === "danger" && "bg-[#ffedd5] text-[#f97316]",
            tone === "info" && "bg-[#dbeafe] text-[#2563eb]",
          )}
        >
          {tone === "success" ? "+" : tone === "danger" ? "!" : "%"}
        </div>
      </div>
    </Card>
  );
}

function ChartTitle({ title }: { title: string }) {
  return <h2 className="font-heading text-xl font-semibold text-[color:var(--foreground)]">{title}</h2>;
}

function MonthlyLineChart({
  max,
  points,
}: {
  max: number;
  points: Array<{ key: string; label: string; value: number }>;
}) {
  const width = 680;
  const height = 260;
  const padding = 34;
  const plotted = points.map((point, index) => {
    const x = padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
    const y = height - padding - (point.value / max) * (height - padding * 2);
    return { ...point, x, y };
  });

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-dashed border-[#dbe5f3]">
      <svg className="h-[300px] w-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + line * ((height - padding * 2) / 3);
          return <line key={line} stroke="#dbe5f3" strokeDasharray="4 4" x1={padding} x2={width - padding} y1={y} y2={y} />;
        })}
        <polyline
          fill="none"
          points={plotted.map((point) => `${point.x},${point.y}`).join(" ")}
          stroke="#f97316"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {plotted.map((point) => (
          <g key={point.key}>
            <circle cx={point.x} cy={point.y} fill="#f97316" r="7" />
            <text fill="#52627a" fontSize="13" textAnchor="middle" x={point.x} y={height - 8}>
              {point.label}
            </text>
            <text fill="#0f172a" fontSize="13" fontWeight="700" textAnchor="middle" x={point.x} y={point.y - 14}>
              {point.value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function InsurancePieChart({ items }: { items: Array<{ name: string; total: number; color: string }> }) {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  let cursor = 0;
  const gradient =
    total === 0
      ? "#e2e8f0 0 100%"
      : items
          .map((item) => {
            const start = cursor;
            const end = cursor + (item.total / total) * 100;
            cursor = end;
            return `${item.color} ${start}% ${end}%`;
          })
          .join(", ");

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr] lg:items-center">
      <div
        className="mx-auto h-56 w-56 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      />
      <div className="space-y-3">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-3 text-sm" key={item.name}>
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: item.color }} />
              <p className="truncate text-[color:var(--muted-strong)]">{item.name}</p>
            </div>
            <p className="font-semibold text-[color:var(--foreground)]">
              {total > 0 ? Math.round((item.total / total) * 100) : 0}%
            </p>
          </div>
        ))}

        {items.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">Sin trabajos registrados este mes.</p>
        ) : null}
      </div>
    </div>
  );
}
