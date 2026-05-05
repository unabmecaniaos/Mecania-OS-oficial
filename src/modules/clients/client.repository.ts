import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const clientRepository = {
  list(search?: string) {
    const where: Prisma.ClientWhereInput = {
      deletedAt: null,
      isWorkshopClient: true,
      ...(search
        ? {
            OR: [
              {
                fullName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    return prisma.client.findMany({
      where,
      include: {
        _count: {
          select: {
            vehicles: {
              where: {
                deletedAt: null,
              },
            },
            workOrders: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.client.findFirst({
      where: {
        id,
        deletedAt: null,
        isWorkshopClient: true,
      },
      include: {
        vehicles: {
          where: {
            deletedAt: null,
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
            vehicle: true,
          },
          orderBy: {
            intakeDate: "desc",
          },
        },
      },
    });
  },

  findByEmail(email: string) {
    return prisma.client.findFirst({
      where: {
        deletedAt: null,
        isWorkshopClient: true,
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  create(data: Prisma.ClientCreateInput) {
    return prisma.client.create({ data });
  },

  update(id: string, data: Prisma.ClientUpdateInput) {
    return prisma.client.update({
      where: { id },
      data,
    });
  },
};
