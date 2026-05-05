import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const vehicleRepository = {
  list(search?: string) {
    const where: Prisma.VehicleWhereInput = {
      deletedAt: null,
      client: {
        isWorkshopClient: true,
      },
      ...(search
        ? {
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
              {
                make: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                model: {
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
            ],
          }
        : {}),
    };

    return prisma.vehicle.findMany({
      where,
      include: {
        client: true,
        _count: {
          select: {
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
    return prisma.vehicle.findFirst({
      where: {
        id,
        deletedAt: null,
        client: {
          isWorkshopClient: true,
        },
      },
      include: {
        client: true,
        workOrders: {
          where: {
            deletedAt: null,
          },
          include: {
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
    });
  },

  findByVinOrPlate(input: { vin?: string; plate?: string }) {
    if (!input.vin && !input.plate) {
      return null;
    }

    return prisma.vehicle.findFirst({
      where: {
        deletedAt: null,
        client: {
          isWorkshopClient: true,
        },
        OR: [
          input.vin
            ? {
                vin: input.vin.toUpperCase(),
              }
            : undefined,
          input.plate
            ? {
                plate: input.plate.toUpperCase(),
              }
            : undefined,
        ].filter(Boolean) as Prisma.VehicleWhereInput[],
      },
      include: {
        client: true,
      },
    });
  },

  create(data: Prisma.VehicleCreateInput) {
    return prisma.vehicle.create({
      data,
    });
  },

  update(id: string, data: Prisma.VehicleUpdateInput) {
    return prisma.vehicle.update({
      where: { id },
      data,
    });
  },
};
