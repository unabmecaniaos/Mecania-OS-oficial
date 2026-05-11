import { Prisma, UserRole, WorkOrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const workOrderRepository = {
  list(filters?: { search?: string; status?: WorkOrderStatus; actorId?: string; actorRole?: UserRole }) {
    const where: Prisma.WorkOrderWhereInput = {
      deletedAt: null,
      ...(filters?.actorRole === UserRole.MECHANIC && filters.actorId
        ? {
            assignedTechnicianId: filters.actorId,
          }
        : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.search
        ? {
            OR: [
              {
                orderNumber: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                reason: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                vehicle: {
                  vin: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              },
              {
                vehicle: {
                  plate: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              },
              {
                client: {
                  fullName: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    };

    return prisma.workOrder.findMany({
      where,
      include: {
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
                email: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
          },
        },
        assignedTechnician: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
          },
        },
        tasks: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        intakeDate: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.workOrder.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
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
                email: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
          },
        },
        budget: {
          include: {
            items: {
              orderBy: [{ itemType: "asc" }, { description: "asc" }],
            },
          },
        },
        assignedTechnician: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
          },
        },
        evidences: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        parts: {
          include: {
            repuesto: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        tasks: {
          orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        },
        statusLogs: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
              },
            },
          },
          orderBy: {
            changedAt: "desc",
          },
        },
      },
    });
  },

  findLastOrderNumberForYear(prefix: string) {
    return prisma.workOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      select: {
        orderNumber: true,
      },
      orderBy: {
        orderNumber: "desc",
      },
    });
  },

  findByIdForAssignment(id: string) {
    return prisma.workOrder.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
  },
};
