import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const inventoryRepository = {
  listRepuestos(search?: string) {
    const where: Prisma.RepuestoWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                code: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    return prisma.repuesto.findMany({
      where,
      include: {
        compatibleVehicles: {
          include: {
            vehicle: {
              include: {
                client: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: [{ currentStock: "asc" }, { name: "asc" }],
    });
  },

  listAvailableRepuestos() {
    return prisma.repuesto.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        code: true,
        unitPrice: true,
        currentStock: true,
        minimumStock: true,
        compatibleVehicles: {
          select: {
            vehicleId: true,
            source: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  listVehicleCompatibilityOptions() {
    return prisma.vehicle.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        client: {
          select: {
            fullName: true,
            isWorkshopClient: true,
          },
        },
      },
      orderBy: [{ make: "asc" }, { model: "asc" }, { vin: "asc" }],
    });
  },

  listPartCompatibilities() {
    return prisma.vehiclePartCompatibility.findMany({
      include: {
        repuesto: true,
        vehicle: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  listRecentMovements(limit = 25) {
    return prisma.stockMovement.findMany({
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
      take: limit,
    });
  },
};
