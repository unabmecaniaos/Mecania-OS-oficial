import { BudgetStatus, UserRole, WorkOrderAreaStatus, WorkOrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { isWorkOrderDelayed } from "@/modules/work-orders/work-order.constants";

const ACTIVE_WORK_ORDER_STATUSES = [
  WorkOrderStatus.RECEIVED,
  WorkOrderStatus.IN_DIAGNOSIS,
  WorkOrderStatus.WAITING_APPROVAL,
  WorkOrderStatus.WAITING_PARTS,
  WorkOrderStatus.IN_REPAIR,
  WorkOrderStatus.IN_PAINT,
  WorkOrderStatus.READY_FOR_DELIVERY,
];

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
  return value.toLocaleDateString("es-CL", {
    month: "short",
  });
}

export async function getDashboardSummary(input?: { actorId?: string; actorRole?: UserRole }) {
  const workOrderScope: Prisma.WorkOrderWhereInput[] = [
    {
      deletedAt: null,
    },
  ];

  if (input?.actorRole === UserRole.MECHANIC && input.actorId) {
    workOrderScope.push({
      OR: [
        {
          assignedTechnicianId: input.actorId,
        },
        {
          assignedPainterId: input.actorId,
        },
      ],
    });
  }

  const workOrderWhere: Prisma.WorkOrderWhereInput = {
    AND: workOrderScope,
  };
  const scopedWorkOrderWhere = (extra: Prisma.WorkOrderWhereInput): Prisma.WorkOrderWhereInput => ({
    AND: [...workOrderScope, extra],
  });
  const today = new Date();
  const monthStart = startOfMonth(today);
  const revenueTrendStart = addMonths(monthStart, -5);
  const revenueTrendMonths = Array.from({ length: 6 }, (_, index) =>
    addMonths(revenueTrendStart, index),
  );
  const revenueStatuses = [
    BudgetStatus.APPROVED,
    BudgetStatus.PARTIALLY_APPROVED,
    BudgetStatus.CONVERTED_TO_WORK_ORDER,
  ];

  const [
    clients,
    vehicles,
    activeOrders,
    awaitingApproval,
    readyForDelivery,
    latestOrders,
    overdueOrdersRaw,
    monthlyRevenue,
    revenueTrendBudgets,
    totalRevenue,
    mechanics,
    mechanicalWorkloadGroups,
    paintWorkloadGroups,
    mechanicsInProcess,
    paintInProcess,
    inventoryParts,
  ] =
    await Promise.all([
      prisma.client.count({
        where: {
          deletedAt: null,
        },
      }),
      prisma.vehicle.count({
        where: {
          deletedAt: null,
        },
      }),
      prisma.workOrder.count({
        where: scopedWorkOrderWhere({
          status: {
            in: ACTIVE_WORK_ORDER_STATUSES,
          },
        }),
      }),
      prisma.workOrder.count({
        where: scopedWorkOrderWhere({
          status: WorkOrderStatus.WAITING_APPROVAL,
        }),
      }),
      prisma.workOrder.count({
        where: scopedWorkOrderWhere({
          status: WorkOrderStatus.READY_FOR_DELIVERY,
        }),
      }),
      prisma.workOrder.findMany({
        where: workOrderWhere,
        include: {
          client: true,
          assignedTechnician: true,
          assignedPainter: true,
          vehicle: true,
        },
        orderBy: {
          intakeDate: "desc",
        },
        take: 5,
      }),
      prisma.workOrder.findMany({
        where: scopedWorkOrderWhere({
          estimatedDate: {
            not: null,
          },
        }),
        select: {
          id: true,
          orderNumber: true,
          status: true,
          estimatedDate: true,
          client: {
            select: {
              fullName: true,
            },
          },
          vehicle: {
            select: {
              make: true,
              model: true,
              plate: true,
              vin: true,
            },
          },
          assignedTechnician: {
            select: {
              name: true,
            },
          },
          assignedPainter: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          estimatedDate: "asc",
        },
      }),
      prisma.budget.aggregate({
        where: {
          deletedAt: null,
          status: {
            in: revenueStatuses,
          },
          createdAt: {
            gte: monthStart,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.budget.findMany({
        where: {
          deletedAt: null,
          status: {
            in: revenueStatuses,
          },
          createdAt: {
            gte: revenueTrendStart,
          },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
      }),
      prisma.budget.aggregate({
        where: {
          deletedAt: null,
          status: {
            in: revenueStatuses,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.user.findMany({
        where: {
          role: UserRole.MECHANIC,
          active: true,
          ...(input?.actorRole === UserRole.MECHANIC && input.actorId
            ? {
                id: input.actorId,
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.workOrder.groupBy({
        by: ["assignedTechnicianId"],
        where: scopedWorkOrderWhere({
          assignedTechnicianId: {
            not: null,
          },
          status: {
            in: ACTIVE_WORK_ORDER_STATUSES,
          },
          OR: [
            {
              mechanicsStatus: WorkOrderAreaStatus.IN_PROGRESS,
            },
            {
              status: WorkOrderStatus.IN_REPAIR,
            },
          ],
        }),
        _count: {
          _all: true,
        },
      }),
      prisma.workOrder.groupBy({
        by: ["assignedPainterId"],
        where: scopedWorkOrderWhere({
          assignedPainterId: {
            not: null,
          },
          status: {
            in: ACTIVE_WORK_ORDER_STATUSES,
          },
          OR: [
            {
              paintStatus: WorkOrderAreaStatus.IN_PROGRESS,
            },
            {
              status: WorkOrderStatus.IN_PAINT,
            },
          ],
        }),
        _count: {
          _all: true,
        },
      }),
      prisma.workOrder.count({
        where: scopedWorkOrderWhere({
          status: {
            in: ACTIVE_WORK_ORDER_STATUSES,
          },
          OR: [
            {
              mechanicsStatus: WorkOrderAreaStatus.IN_PROGRESS,
            },
            {
              status: WorkOrderStatus.IN_REPAIR,
            },
          ],
        }),
      }),
      prisma.workOrder.count({
        where: scopedWorkOrderWhere({
          status: {
            in: ACTIVE_WORK_ORDER_STATUSES,
          },
          OR: [
            {
              paintStatus: WorkOrderAreaStatus.IN_PROGRESS,
            },
            {
              status: WorkOrderStatus.IN_PAINT,
            },
          ],
        }),
      }),
      prisma.repuesto.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          code: true,
          currentStock: true,
          minimumStock: true,
        },
        orderBy: [{ currentStock: "asc" }, { name: "asc" }],
      }),
    ]);

  const overdueOrderList = overdueOrdersRaw.filter((order) =>
    isWorkOrderDelayed({
      status: order.status,
      promisedDate: order.estimatedDate,
    }),
  );
  const overdueOrders = overdueOrderList.length;
  const mechanicalCounts = new Map(
    mechanicalWorkloadGroups
      .filter((group) => group.assignedTechnicianId)
      .map((group) => [group.assignedTechnicianId as string, group._count._all]),
  );
  const paintCounts = new Map(
    paintWorkloadGroups
      .filter((group) => group.assignedPainterId)
      .map((group) => [group.assignedPainterId as string, group._count._all]),
  );
  const mechanicWorkload = mechanics
    .map((mechanic) => {
      const mechanicalOrders = mechanicalCounts.get(mechanic.id) ?? 0;
      const paintOrders = paintCounts.get(mechanic.id) ?? 0;

      return {
        ...mechanic,
        mechanicalOrders,
        paintOrders,
        totalOrders: mechanicalOrders + paintOrders,
      };
    })
    .sort((left, right) => right.totalOrders - left.totalOrders || left.name.localeCompare(right.name));
  const lowStockParts = inventoryParts.filter((part) => part.currentStock <= part.minimumStock);
  const monthlyRevenueGross = monthlyRevenue._sum.totalAmount ?? 0;
  const monthlyRevenueNet = Math.round(monthlyRevenueGross / 1.19);
  const monthlyRevenueTax = monthlyRevenueGross - monthlyRevenueNet;
  const revenueByMonth = new Map<string, number>();

  for (const budget of revenueTrendBudgets) {
    const key = monthKey(budget.createdAt);
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + budget.totalAmount);
  }

  return {
    clients,
    vehicles,
    activeOrders,
    awaitingApproval,
    readyForDelivery,
    overdueOrders,
    overdueOrderList: overdueOrderList.slice(0, 5),
    latestOrders,
    financial: {
      monthlyRevenueGross,
      monthlyRevenueNet,
      monthlyRevenueTax,
      totalApprovedRevenue: totalRevenue._sum.totalAmount ?? 0,
      monthlyTrend: revenueTrendMonths.map((month) => ({
        key: monthKey(month),
        label: monthLabel(month),
        amount: revenueByMonth.get(monthKey(month)) ?? 0,
      })),
    },
    operational: {
      mechanicsInProcess,
      paintInProcess,
      readyForDelivery,
    },
    inventory: {
      lowStockCount: lowStockParts.length,
      lowStockParts: lowStockParts.slice(0, 5),
    },
    mechanicWorkload,
  };
}
