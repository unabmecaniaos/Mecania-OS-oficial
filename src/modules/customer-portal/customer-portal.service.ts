import { BudgetStatus, SelfInspectionStatus, WorkOrderStatus } from "@prisma/client";

import { NotFoundError, UnauthorizedError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser } from "@/modules/auth/auth.service";
import {
  getWorkOrderAutomaticProgressPercent,
  isClosedStatus,
} from "@/modules/work-orders/work-order.constants";

function getCurrentOrLatestWorkOrder<T extends { status: Parameters<typeof isClosedStatus>[0] }>(
  workOrders: T[],
) {
  return workOrders.find((workOrder) => !isClosedStatus(workOrder.status)) ?? workOrders[0] ?? null;
}

const CUSTOMER_PORTAL_PENDING_INSPECTION_STATUSES = [
  SelfInspectionStatus.DRAFT,
  SelfInspectionStatus.IN_PROGRESS,
  SelfInspectionStatus.SUBMITTED,
  SelfInspectionStatus.UNDER_REVIEW,
  SelfInspectionStatus.REVIEWED,
] as const;

const CUSTOMER_PORTAL_VISIBLE_BUDGET_STATUSES = [
  BudgetStatus.SENT,
  BudgetStatus.APPROVED,
  BudgetStatus.REJECTED,
  BudgetStatus.CONVERTED_TO_WORK_ORDER,
] as const;

export async function getCustomerPortalOverview() {
  const session = await requireCustomerUser();

  if (!session.user.clientId) {
    return {
      customer: null,
      vehicles: [],
      pendingInspections: [],
      budgets: [],
      stats: {
        vehicles: 0,
        pendingInspections: 0,
        openOrders: 0,
        readyForDelivery: 0,
        pendingBudgets: 0,
      },
    };
  }

  const customer = await prisma.client.findFirst({
    where: {
      id: session.user.clientId,
      deletedAt: null,
    },
    include: {
      vehicles: {
        where: {
          deletedAt: null,
        },
        include: {
          workOrders: {
            where: {
              deletedAt: null,
            },
            include: {
              tasks: {
                select: {
                  status: true,
                },
              },
              statusLogs: {
                orderBy: {
                  changedAt: "desc",
                },
                take: 1,
              },
            },
            orderBy: {
              intakeDate: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      selfInspections: {
        where: {
          deletedAt: null,
          vehicleId: null,
          status: {
            in: [...CUSTOMER_PORTAL_PENDING_INSPECTION_STATUSES],
          },
        },
        include: {
          vehicleSnapshot: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      budgets: {
        where: {
          deletedAt: null,
          status: {
            in: [...CUSTOMER_PORTAL_VISIBLE_BUDGET_STATUSES],
          },
        },
        include: {
          insuranceCase: {
            select: {
              id: true,
              caseNumber: true,
            },
          },
          vehicle: true,
          workOrder: true,
          items: {
            orderBy: [{ itemType: "asc" }, { description: "asc" }],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!customer) {
    return {
      customer: null,
      vehicles: [],
      pendingInspections: [],
      budgets: [],
      stats: {
        vehicles: 0,
        pendingInspections: 0,
        openOrders: 0,
        readyForDelivery: 0,
        pendingBudgets: 0,
      },
    };
  }

  const vehicles = customer.vehicles.map((vehicle) => {
    const currentOrder = getCurrentOrLatestWorkOrder(vehicle.workOrders);

    return {
      ...vehicle,
      currentOrder,
      progressPercent: currentOrder
        ? getWorkOrderAutomaticProgressPercent({
            status: currentOrder.status,
            tasks: currentOrder.tasks,
          })
        : 0,
    };
  });
  const pendingInspections = customer.selfInspections.map((inspection) => ({
    ...inspection,
    progressPercent: inspection.completionPercent,
  }));
  const budgets = customer.budgets;

  const openOrders = vehicles.filter(
    (vehicle) => vehicle.currentOrder && !isClosedStatus(vehicle.currentOrder.status),
  ).length;
  const readyForDelivery = vehicles.filter(
    (vehicle) => vehicle.currentOrder?.status === WorkOrderStatus.READY_FOR_DELIVERY,
  ).length;
  const pendingBudgets = budgets.filter(
    (budget) => budget.status === BudgetStatus.SENT && !budget.insuranceCase,
  ).length;

  return {
    customer,
    vehicles,
    pendingInspections,
    budgets,
    stats: {
      vehicles: vehicles.length,
      pendingInspections: pendingInspections.length,
      openOrders,
      readyForDelivery,
      pendingBudgets,
    },
  };
}

export async function getCustomerPortalVehicleDetail(vehicleId: string) {
  const session = await requireCustomerUser();

  if (!session.user.clientId) {
    throw new UnauthorizedError("Tu acceso al portal aun no esta habilitado");
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      clientId: session.user.clientId,
      deletedAt: null,
    },
    include: {
      client: true,
      workOrders: {
        where: {
          deletedAt: null,
        },
        include: {
          tasks: {
            select: {
              status: true,
            },
          },
          evidences: {
            include: {
              uploadedBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          statusLogs: {
            include: {
              changedBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              changedAt: "desc",
            },
          },
        },
        orderBy: {
          intakeDate: "desc",
        },
      },
    },
  });

  if (!vehicle) {
    throw new NotFoundError("Vehiculo no encontrado");
  }

  const currentOrder = getCurrentOrLatestWorkOrder(vehicle.workOrders);
  const featuredOrder = currentOrder ?? vehicle.workOrders[0] ?? null;

  return {
    ...vehicle,
    currentOrder,
    featuredOrder,
    progressPercent: currentOrder
      ? getWorkOrderAutomaticProgressPercent({
          status: currentOrder.status,
          tasks: currentOrder.tasks,
        })
      : 0,
  };
}

export async function getCustomerPortalBudgetDetail(budgetId: string) {
  const session = await requireCustomerUser();

  if (!session.user.clientId) {
    throw new UnauthorizedError("Tu acceso al portal aun no esta habilitado");
  }

  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      clientId: session.user.clientId,
      deletedAt: null,
      status: {
        in: [...CUSTOMER_PORTAL_VISIBLE_BUDGET_STATUSES],
      },
    },
    include: {
      insuranceCase: {
        select: {
          id: true,
          caseNumber: true,
        },
      },
      client: true,
      vehicle: true,
      workOrder: true,
      items: {
        orderBy: [{ itemType: "asc" }, { description: "asc" }],
      },
      statusLogs: {
        include: {
          changedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          changedAt: "desc",
        },
      },
    },
  });

  if (!budget) {
    throw new NotFoundError("Presupuesto no encontrado");
  }

  return budget;
}

export async function respondToCustomerBudget(
  budgetId: string,
  input: {
    nextStatus: "APPROVED" | "REJECTED";
    note?: string;
  },
) {
  const session = await requireCustomerUser();
  const budget = await getCustomerPortalBudgetDetail(budgetId);

  if (budget.status !== BudgetStatus.SENT) {
    throw new UnauthorizedError("Este presupuesto ya no admite respuesta del cliente");
  }

  if (budget.insuranceCase) {
    throw new UnauthorizedError(
      "Este presupuesto esta siendo revisado por la aseguradora desde el portal del liquidador",
    );
  }

  const changedAt = new Date();

  return prisma.budget.update({
    where: {
      id: budget.id,
    },
    data: {
      status: input.nextStatus,
      updatedById: session.user.id,
      approvedAt: input.nextStatus === BudgetStatus.APPROVED ? changedAt : undefined,
      rejectedAt: input.nextStatus === BudgetStatus.REJECTED ? changedAt : undefined,
      statusLogs: {
        create: {
          previousStatus: budget.status,
          nextStatus: input.nextStatus,
          note: input.note?.trim() || undefined,
          changedById: session.user.id,
          changedAt,
        },
      },
    },
    include: {
      workOrder: true,
    },
  });
}
