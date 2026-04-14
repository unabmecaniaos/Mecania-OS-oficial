import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const userRepository = {
  listUsers(filters?: { search?: string; role?: UserRole }) {
    return prisma.user.findMany({
      where: {
        ...(filters?.role
          ? {
              role: filters.role,
            }
          : {}),
        ...(filters?.search
          ? {
              OR: [
                {
                  name: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: filters.search,
                    mode: "insensitive",
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
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [
        {
          role: "asc",
        },
        {
          name: "asc",
        },
      ],
    });
  },

  listMechanics() {
    return prisma.user.findMany({
      where: {
        role: UserRole.MECHANIC,
        active: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  },

  findByClientId(clientId: string) {
    return prisma.user.findUnique({
      where: { clientId },
    });
  },

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    clientId?: string;
  }) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        ...(data.clientId
          ? {
              client: {
                connect: {
                  id: data.clientId,
                },
              },
            }
          : {}),
      },
    });
  },

  linkClient(id: string, clientId: string) {
    return prisma.user.update({
      where: { id },
      data: {
        client: {
          connect: {
            id: clientId,
          },
        },
      },
    });
  },

  update(
    id: string,
    data: {
      name: string;
      email: string;
      role: UserRole;
      active: boolean;
      passwordHash?: string;
      clientId?: string | null;
    },
  ) {
    return prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        active: data.active,
        ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
        ...(data.clientId === undefined
          ? {}
          : data.clientId
            ? {
                client: {
                  connect: {
                    id: data.clientId,
                  },
                },
              }
            : {
                client: {
                  disconnect: true,
                },
              }),
      },
    });
  },

  async getDeletionImpact(id: string) {
    const [
      createdWorkOrders,
      uploadedWorkOrderEvidences,
      workOrderStatusChanges,
      createdQuotes,
      quoteStatusChanges,
      selfInspectionReviews,
    ] = await prisma.$transaction([
      prisma.workOrder.count({
        where: { createdById: id },
      }),
      prisma.workOrderEvidence.count({
        where: { uploadedById: id },
      }),
      prisma.workOrderStatusLog.count({
        where: { changedById: id },
      }),
      prisma.quote.count({
        where: { createdById: id },
      }),
      prisma.quoteStatusLog.count({
        where: { changedById: id },
      }),
      prisma.selfInspectionReview.count({
        where: { reviewedById: id },
      }),
    ]);

    return {
      createdWorkOrders,
      uploadedWorkOrderEvidences,
      workOrderStatusChanges,
      createdQuotes,
      quoteStatusChanges,
      selfInspectionReviews,
    };
  },

  delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },
};
