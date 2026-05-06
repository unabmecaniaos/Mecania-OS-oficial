import { BudgetStatus, Prisma, WorkOrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const insuranceCaseListInclude = {
  client: true,
  vehicle: true,
  liquidator: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  },
  photos: {
    orderBy: {
      createdAt: "asc",
    },
    take: 1,
  },
  budgets: {
    where: {
      deletedAt: null,
    },
    include: {
      workOrder: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  },
  workOrders: {
    where: {
      deletedAt: null,
    },
    include: {
      evidences: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      intakeDate: "desc",
    },
    take: 1,
  },
} satisfies Prisma.InsuranceCaseInclude;

const insuranceCaseDetailInclude = {
  client: true,
  vehicle: true,
  liquidator: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  },
  photos: {
    orderBy: {
      createdAt: "asc",
    },
  },
  budgets: {
    where: {
      deletedAt: null,
    },
    include: {
      client: true,
      vehicle: true,
      items: {
        orderBy: [{ itemType: "asc" }, { description: "asc" }],
      },
      statusLogs: {
        include: {
          changedBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          changedAt: "desc",
        },
      },
      workOrder: {
        include: {
          evidences: {
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
                  role: true,
                },
              },
            },
            orderBy: {
              changedAt: "desc",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },
  workOrders: {
    where: {
      deletedAt: null,
    },
    include: {
      budget: {
        include: {
          items: {
            orderBy: [{ itemType: "asc" }, { description: "asc" }],
          },
        },
      },
      evidences: {
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
              role: true,
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
} satisfies Prisma.InsuranceCaseInclude;

export const insuranceCaseRepository = {
  countCreatedToday(start: Date, end: Date) {
    return prisma.insuranceCase.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });
  },

  findLatestByClientVehicle(clientId: string, vehicleId: string) {
    return prisma.insuranceCase.findFirst({
      where: {
        clientId,
        vehicleId,
      },
      select: {
        id: true,
        caseNumber: true,
        liquidatorId: true,
      },
      orderBy: [{ incidentDate: "desc" }, { createdAt: "desc" }],
    });
  },

  findLatestByVehicle(vehicleId: string) {
    return prisma.insuranceCase.findFirst({
      where: {
        vehicleId,
      },
      select: {
        id: true,
        caseNumber: true,
        liquidatorId: true,
      },
      orderBy: [{ incidentDate: "desc" }, { createdAt: "desc" }],
    });
  },

  listForLiquidator(liquidatorId: string) {
    return prisma.insuranceCase.findMany({
      where: {
        liquidatorId,
      },
      include: insuranceCaseListInclude,
      orderBy: [{ incidentDate: "desc" }, { createdAt: "desc" }],
    });
  },

  listForInternal(search?: string) {
    return prisma.insuranceCase.findMany({
      where: {
        createdFromLiquidatorPortal: true,
        ...(search
          ? {
              OR: [
                {
                  caseNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  claimNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  ownerFullName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  vehicle: {
                    plate: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  vehicle: {
                    vin: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  vehicle: {
                    make: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  vehicle: {
                    model: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  liquidator: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: insuranceCaseListInclude,
      orderBy: [{ incidentDate: "desc" }, { createdAt: "desc" }],
    });
  },

  findByIdForLiquidator(id: string, liquidatorId: string) {
    return prisma.insuranceCase.findFirst({
      where: {
        id,
        liquidatorId,
      },
      include: insuranceCaseDetailInclude,
    });
  },

  findByIdForInternal(id: string) {
    return prisma.insuranceCase.findUnique({
      where: {
        id,
      },
      include: insuranceCaseDetailInclude,
    });
  },

  create(input: {
    caseNumber: string;
    clientId: string;
    vehicleId: string;
    liquidatorId: string;
    createdFromLiquidatorPortal: boolean;
    ownerFullName: string;
    ownerPhone: string;
    ownerEmail?: string;
    ownerAddress?: string;
    claimNumber?: string;
    policyNumber?: string;
    incidentDate: Date;
    incidentLocation?: string;
    description: string;
  }) {
    return prisma.insuranceCase.create({
      data: input,
    });
  },

  createPhotos(
    insuranceCaseId: string,
    photos: Array<{
      fileUrl: string;
      storageKey: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      note?: string;
    }>,
  ) {
    return prisma.insuranceCase.update({
      where: {
        id: insuranceCaseId,
      },
      data: {
        photos: {
          create: photos,
        },
      },
      include: insuranceCaseDetailInclude,
    });
  },

  findBudgetForLiquidator(budgetId: string, liquidatorId: string) {
    return prisma.budget.findFirst({
      where: {
        id: budgetId,
        deletedAt: null,
        insuranceCase: {
          liquidatorId,
        },
      },
      include: {
        insuranceCase: {
          select: {
            id: true,
            caseNumber: true,
            liquidatorId: true,
          },
        },
      },
    });
  },

  transitionBudgetForLiquidator(input: {
    budgetId: string;
    previousStatus: BudgetStatus;
    nextStatus: BudgetStatus;
    note?: string;
    changedById: string;
    changedAt: Date;
  }) {
    return prisma.budget.update({
      where: {
        id: input.budgetId,
      },
      data: {
        status: input.nextStatus,
        updatedById: input.changedById,
        approvedAt:
          input.nextStatus === BudgetStatus.APPROVED ||
          input.nextStatus === BudgetStatus.PARTIALLY_APPROVED
            ? input.changedAt
            : undefined,
        rejectedAt:
          input.nextStatus === BudgetStatus.REJECTED ? input.changedAt : undefined,
        statusLogs: {
          create: {
            previousStatus: input.previousStatus,
            nextStatus: input.nextStatus,
            note: input.note,
            changedById: input.changedById,
            changedAt: input.changedAt,
          },
        },
      },
    });
  },
};

export type InsuranceCaseListRecord = Prisma.InsuranceCaseGetPayload<{
  include: typeof insuranceCaseListInclude;
}>;

export type InsuranceCaseDetailRecord = Prisma.InsuranceCaseGetPayload<{
  include: typeof insuranceCaseDetailInclude;
}>;

export function isReadyWorkOrderStatus(status: WorkOrderStatus) {
  return status === WorkOrderStatus.READY_FOR_DELIVERY || status === WorkOrderStatus.DELIVERED;
}
