import { Prisma, TimeOffRequestStatus, UserRole, WorkOrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const timeOffInclude = {
  mechanic: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.MechanicTimeOffRequestInclude;

const activeWorkOrderStatuses = [
  WorkOrderStatus.RECEIVED,
  WorkOrderStatus.IN_DIAGNOSIS,
  WorkOrderStatus.WAITING_APPROVAL,
  WorkOrderStatus.WAITING_PARTS,
  WorkOrderStatus.IN_REPAIR,
  WorkOrderStatus.IN_PAINT,
  WorkOrderStatus.READY_FOR_DELIVERY,
] as const;

export const timeOffRepository = {
  listMechanics() {
    return prisma.user.findMany({
      where: {
        role: UserRole.MECHANIC,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  listForAdmin() {
    return prisma.mechanicTimeOffRequest.findMany({
      include: timeOffInclude,
      orderBy: [{ status: "asc" }, { startDate: "asc" }, { createdAt: "desc" }],
    });
  },

  listForMechanic(mechanicId: string) {
    return prisma.mechanicTimeOffRequest.findMany({
      where: {
        mechanicId,
      },
      include: timeOffInclude,
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    });
  },

  findById(id: string) {
    return prisma.mechanicTimeOffRequest.findUnique({
      where: {
        id,
      },
      include: timeOffInclude,
    });
  },

  create(input: {
    mechanicId: string;
    type: Prisma.MechanicTimeOffRequestCreateInput["type"];
    startDate: Date;
    endDate: Date;
    reason?: string;
  }) {
    return prisma.mechanicTimeOffRequest.create({
      data: {
        mechanicId: input.mechanicId,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason,
      },
      include: timeOffInclude,
    });
  },

  review(input: {
    id: string;
    status: TimeOffRequestStatus;
    reviewedById: string;
    reviewNote?: string;
  }) {
    return prisma.mechanicTimeOffRequest.update({
      where: {
        id: input.id,
      },
      data: {
        status: input.status,
        reviewedById: input.reviewedById,
        reviewNote: input.reviewNote,
        reviewedAt: new Date(),
      },
      include: timeOffInclude,
    });
  },

  countActiveOrdersInRange(input: { startDate: Date; endDate: Date }) {
    return prisma.workOrder.count({
      where: {
        deletedAt: null,
        status: {
          in: [...activeWorkOrderStatuses],
        },
        intakeDate: {
          lte: input.endDate,
        },
        OR: [
          {
            estimatedDate: null,
          },
          {
            estimatedDate: {
              gte: input.startDate,
            },
          },
        ],
      },
    });
  },

  countAssignedActiveOrdersInRange(input: {
    mechanicId: string;
    startDate: Date;
    endDate: Date;
  }) {
    return prisma.workOrder.count({
      where: {
        deletedAt: null,
        status: {
          in: [...activeWorkOrderStatuses],
        },
        intakeDate: {
          lte: input.endDate,
        },
        OR: [
          {
            assignedTechnicianId: input.mechanicId,
          },
          {
            assignedPainterId: input.mechanicId,
          },
        ],
        AND: [
          {
            OR: [
              {
                estimatedDate: null,
              },
              {
                estimatedDate: {
                  gte: input.startDate,
                },
              },
            ],
          },
        ],
      },
    });
  },
};

export type TimeOffRequestRecord = Prisma.MechanicTimeOffRequestGetPayload<{
  include: typeof timeOffInclude;
}>;
