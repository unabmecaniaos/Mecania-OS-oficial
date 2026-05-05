import { BudgetItemType, BudgetStatus, Prisma, SelfInspectionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const budgetListInclude = {
  client: true,
  vehicle: true,
  insuranceCase: {
    select: {
      id: true,
      caseNumber: true,
      liquidator: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  items: {
    orderBy: [{ itemType: "asc" }, { description: "asc" }],
  },
} satisfies Prisma.BudgetInclude;

const budgetDetailInclude = {
  client: true,
  vehicle: true,
  insuranceCase: {
    include: {
      liquidator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  selfInspection: true,
  workOrder: true,
  createdBy: true,
  updatedBy: true,
  items: {
    include: {
      referenceCatalog: true,
    },
    orderBy: [{ itemType: "asc" }, { description: "asc" }],
  },
  statusLogs: {
    include: {
      changedBy: true,
    },
    orderBy: {
      changedAt: "desc",
    },
  },
} satisfies Prisma.BudgetInclude;

export const budgetRepository = {
  list(search?: string) {
    return prisma.budget.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                {
                  budgetNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  title: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  client: {
                    fullName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  vehicle: {
                    OR: [
                      {
                        plate: {
                          contains: search,
                          mode: "insensitive",
                        },
                      },
                      {
                        vin: {
                          contains: search,
                          mode: "insensitive",
                        },
                      },
                    ],
                  },
                },
              ],
            }
          : {}),
      },
      include: budgetListInclude,
      orderBy: {
        createdAt: "desc",
      },
    });
  },
  findById(id: string) {
    return prisma.budget.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: budgetDetailInclude,
    });
  },
  listWorkshopCreateContext() {
    return Promise.all([
      prisma.client.findMany({
        where: {
          deletedAt: null,
          isWorkshopClient: true,
        },
        include: {
          vehicles: {
            where: {
              deletedAt: null,
            },
            orderBy: [{ make: "asc" }, { model: "asc" }],
          },
        },
        orderBy: {
          fullName: "asc",
        },
      }),
      prisma.budgetReferenceCatalog.findMany({
        where: {
          active: true,
        },
        orderBy: [{ itemType: "asc" }, { name: "asc" }],
      }),
      prisma.repuesto.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: [{ name: "asc" }],
      }),
      prisma.selfInspection.findMany({
        where: {
          deletedAt: null,
          status: SelfInspectionStatus.REVIEWED,
          vehicleId: {
            not: null,
          },
        },
        include: {
          customer: true,
          vehicle: true,
          reviews: {
            orderBy: {
              reviewedAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          reviewedAt: "desc",
        },
      }),
    ]);
  },
  listLiquidatorCreateContext() {
    return Promise.all([
      prisma.budgetReferenceCatalog.findMany({
        where: {
          active: true,
        },
        orderBy: [{ itemType: "asc" }, { name: "asc" }],
      }),
      prisma.repuesto.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: [{ name: "asc" }],
      }),
      prisma.insuranceCase.findMany({
        where: {
          createdFromLiquidatorPortal: true,
        },
        include: {
          liquidator: {
            select: {
              id: true,
              name: true,
            },
          },
          vehicle: true,
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
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: [{ incidentDate: "desc" }, { createdAt: "desc" }],
      }),
    ]);
  },
  countCreatedToday(start: Date, end: Date) {
    return prisma.budget.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });
  },
  async createDraft(input: {
    budgetNumber: string;
    clientId: string;
    vehicleId: string;
    insuranceCaseId?: string;
    selfInspectionId?: string;
    title: string;
    summary?: string;
    createdById: string;
    items: Array<{
      referenceCatalogId?: string;
      itemType: BudgetItemType;
      description: string;
      referenceCode?: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      sourceLabel?: string;
      sourceUrl?: string;
      note?: string;
    }>;
    subtotalParts: number;
    subtotalLabor: number;
    subtotalSupplies: number;
    totalAmount: number;
  }) {
    return prisma.budget.create({
      data: {
        budgetNumber: input.budgetNumber,
        clientId: input.clientId,
        vehicleId: input.vehicleId,
        insuranceCaseId: input.insuranceCaseId,
        selfInspectionId: input.selfInspectionId,
        title: input.title,
        summary: input.summary,
        createdById: input.createdById,
        updatedById: input.createdById,
        subtotalParts: input.subtotalParts,
        subtotalLabor: input.subtotalLabor,
        subtotalSupplies: input.subtotalSupplies,
        totalAmount: input.totalAmount,
        items: {
          create: input.items,
        },
        statusLogs: {
          create: {
            previousStatus: null,
            nextStatus: BudgetStatus.DRAFT,
            note: "Presupuesto creado en borrador.",
            changedById: input.createdById,
          },
        },
      },
      include: budgetDetailInclude,
    });
  },
  async updateDraft(
    budgetId: string,
    input: {
      title: string;
      summary?: string;
      updatedById: string;
      subtotalParts: number;
      subtotalLabor: number;
      subtotalSupplies: number;
      totalAmount: number;
      items: Array<{
        id: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        note?: string;
      }>;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      for (const item of input.items) {
        await tx.budgetItem.update({
          where: { id: item.id },
          data: {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            note: item.note,
          },
        });
      }

      return tx.budget.update({
        where: { id: budgetId },
        data: {
          title: input.title,
          summary: input.summary,
          updatedById: input.updatedById,
          subtotalParts: input.subtotalParts,
          subtotalLabor: input.subtotalLabor,
          subtotalSupplies: input.subtotalSupplies,
          totalAmount: input.totalAmount,
        },
        include: budgetDetailInclude,
      });
    });
  },
  async transitionStatus(
    budgetId: string,
    input: {
      previousStatus: BudgetStatus;
      nextStatus: BudgetStatus;
      note?: string;
      changedById: string;
      changedAt: Date;
    },
  ) {
    return prisma.budget.update({
      where: { id: budgetId },
      data: {
        status: input.nextStatus,
        updatedById: input.changedById,
        sentAt: input.nextStatus === BudgetStatus.SENT ? input.changedAt : undefined,
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
      include: budgetDetailInclude,
    });
  },
};
