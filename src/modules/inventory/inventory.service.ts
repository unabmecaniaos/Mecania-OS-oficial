import {
  Prisma,
  StockMovementSourceType,
  StockMovementType,
  VehiclePartCompatibilitySource,
} from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { isValidVinFormat, vinSchema } from "@/lib/vin";
import { inventoryRepository } from "@/modules/inventory/inventory.repository";
import {
  adjustStockSchema,
  assignPartCompatibilitySchema,
  createRepuestoSchema,
  registerStockEntrySchema,
  setWorkOrderPartUsageSchema,
} from "@/modules/inventory/inventory.schemas";

const inventoryLogger = createLogger("inventory");

type InventoryTx = Prisma.TransactionClient;

type ApplyStockMovementInput = {
  repuestoId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string | null;
  sourceType?: StockMovementSourceType;
  sourceId?: string;
  createdById?: string;
};

async function applyStockMovement(tx: InventoryTx, input: ApplyStockMovementInput) {
  const repuesto = await tx.repuesto.findUnique({
    where: { id: input.repuestoId },
    select: {
      id: true,
      currentStock: true,
    },
  });

  if (!repuesto) {
    throw new NotFoundError("Repuesto no encontrado");
  }

  const previousStock = repuesto.currentStock;
  const newStock = previousStock + input.quantity;

  if (newStock < 0) {
    throw new ConflictError("El movimiento dejaria el stock en negativo");
  }

  const updated = await tx.repuesto.updateMany({
    where: {
      id: input.repuestoId,
      currentStock: previousStock,
    },
    data: {
      currentStock: newStock,
    },
  });

  if (updated.count !== 1) {
    throw new ConflictError("El stock cambio mientras se registraba el movimiento. Intentalo de nuevo");
  }

  return tx.stockMovement.create({
    data: {
      repuestoId: input.repuestoId,
      type: input.type,
      quantity: input.quantity,
      previousStock,
      newStock,
      reason: input.reason,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      createdById: input.createdById,
    },
  });
}

export async function listInventory(input?: { search?: string; lowStock?: boolean }) {
  const repuestos = await inventoryRepository.listRepuestos(input?.search?.trim());

  return repuestos
    .map((repuesto) => ({
      ...repuesto,
      isLowStock: repuesto.currentStock <= repuesto.minimumStock,
    }))
    .filter((repuesto) => (input?.lowStock ? repuesto.isLowStock : true));
}

export async function listInventoryOptions() {
  return inventoryRepository.listAvailableRepuestos();
}

export async function getPartCompatibilityContext() {
  const [repuestos, vehicles, compatibilities] = await Promise.all([
    inventoryRepository.listAvailableRepuestos(),
    inventoryRepository.listVehicleCompatibilityOptions(),
    inventoryRepository.listPartCompatibilities(),
  ]);

  return {
    repuestos,
    vehicles,
    compatibilities,
  };
}

export async function getCompatiblePartsByVin(input: string) {
  const vin = vinSchema.parse(input);
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      vin,
      deletedAt: null,
    },
    select: {
      id: true,
      vin: true,
      plate: true,
      make: true,
      model: true,
      year: true,
      client: {
        select: {
          fullName: true,
          isWorkshopClient: true,
        },
      },
      compatibleParts: {
        include: {
          repuesto: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!vehicle) {
    throw new NotFoundError("Vehiculo no encontrado para el VIN indicado");
  }

  return {
    vehicle: {
      id: vehicle.id,
      vin: vehicle.vin,
      plate: vehicle.plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      clientName: vehicle.client.fullName,
      isWorkshopClient: vehicle.client.isWorkshopClient,
    },
    compatibleParts: vehicle.compatibleParts.map((compatibility) => ({
      id: compatibility.repuesto.id,
      name: compatibility.repuesto.name,
      code: compatibility.repuesto.code,
      unitPrice: compatibility.repuesto.unitPrice,
      currentStock: compatibility.repuesto.currentStock,
      minimumStock: compatibility.repuesto.minimumStock,
      source: compatibility.source,
      notes: compatibility.notes,
    })),
  };
}

export async function listRecentStockMovements(limit?: number) {
  return inventoryRepository.listRecentMovements(limit);
}

export async function createRepuesto(input: unknown, actorId: string) {
  const data = createRepuestoSchema.parse(input);

  const repuesto = await prisma.$transaction(async (tx) => {
    const existing = await tx.repuesto.findUnique({
      where: { code: data.code },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictError("Ya existe un repuesto con ese codigo o referencia");
    }

    const repuesto = await tx.repuesto.create({
      data: {
        name: data.name,
        code: data.code,
        unitPrice: data.unitPrice,
        currentStock: 0,
        minimumStock: data.minimumStock,
      },
    });

    if (data.initialStock > 0) {
      await applyStockMovement(tx, {
        repuestoId: repuesto.id,
        type: StockMovementType.INITIAL,
        quantity: data.initialStock,
        reason: "Stock inicial al crear repuesto",
        sourceType: StockMovementSourceType.INVENTORY,
        sourceId: repuesto.id,
        createdById: actorId,
      });
    }

    if (data.compatibleVehicleId) {
      const vehicle = await tx.vehicle.findFirst({
        where: {
          id: data.compatibleVehicleId,
          deletedAt: null,
        },
        select: {
          vin: true,
        },
      });

      if (!vehicle) {
        throw new NotFoundError("Vehiculo no encontrado");
      }

      if (!isValidVinFormat(vehicle.vin)) {
        throw new ConflictError("El vehiculo seleccionado no tiene un VIN valido para compatibilidad");
      }

      await tx.vehiclePartCompatibility.create({
        data: {
          vehicleId: data.compatibleVehicleId,
          repuestoId: repuesto.id,
          source: VehiclePartCompatibilitySource.MANUAL,
          notes: "Compatibilidad registrada al crear el repuesto",
        },
      });
    }

    return tx.repuesto.findUniqueOrThrow({
      where: { id: repuesto.id },
    });
  });

  inventoryLogger.info("Inventory item created", {
    actorId,
    repuestoId: repuesto.id,
    code: repuesto.code,
  });

  return repuesto;
}

export async function assignPartCompatibility(input: unknown, actorId: string) {
  const data = assignPartCompatibilitySchema.parse(input);

  const [repuesto, vehicle] = await Promise.all([
    prisma.repuesto.findFirst({
      where: {
        id: data.repuestoId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    }),
    prisma.vehicle.findFirst({
      where: {
        id: data.vehicleId,
        deletedAt: null,
      },
      select: {
        id: true,
        vin: true,
      },
    }),
  ]);

  if (!repuesto) {
    throw new NotFoundError("Repuesto no encontrado");
  }

  if (!vehicle) {
    throw new NotFoundError("Vehiculo no encontrado");
  }

  if (!isValidVinFormat(vehicle.vin)) {
    throw new ConflictError("El vehiculo seleccionado no tiene un VIN valido para compatibilidad");
  }

  const compatibility = await prisma.vehiclePartCompatibility.upsert({
    where: {
      vehicleId_repuestoId: {
        vehicleId: data.vehicleId,
        repuestoId: data.repuestoId,
      },
    },
    create: {
      vehicleId: data.vehicleId,
      repuestoId: data.repuestoId,
      source: VehiclePartCompatibilitySource.MANUAL,
      notes: data.notes,
    },
    update: {
      source: VehiclePartCompatibilitySource.MANUAL,
      notes: data.notes,
    },
  });

  inventoryLogger.info("Part compatibility assigned", {
    actorId,
    compatibilityId: compatibility.id,
    repuestoId: data.repuestoId,
    vehicleId: data.vehicleId,
  });

  return compatibility;
}

export async function registerStockEntry(input: unknown, actorId: string) {
  const data = registerStockEntrySchema.parse(input);

  const movement = await prisma.$transaction((tx) =>
    applyStockMovement(tx, {
      repuestoId: data.repuestoId,
      type: StockMovementType.ENTRY,
      quantity: data.quantity,
      reason: data.reason ?? "Ingreso de stock",
      sourceType: StockMovementSourceType.INVENTORY,
      sourceId: data.repuestoId,
      createdById: actorId,
    }),
  );

  inventoryLogger.info("Stock entry registered", {
    actorId,
    repuestoId: data.repuestoId,
    movementId: movement.id,
    quantity: data.quantity,
  });

  return movement;
}

export async function adjustStock(input: unknown, actorId: string) {
  const data = adjustStockSchema.parse(input);

  const movement = await prisma.$transaction((tx) =>
    applyStockMovement(tx, {
      repuestoId: data.repuestoId,
      type: StockMovementType.ADJUSTMENT,
      quantity: data.quantity,
      reason: data.reason,
      sourceType: StockMovementSourceType.INVENTORY,
      sourceId: data.repuestoId,
      createdById: actorId,
    }),
  );

  inventoryLogger.info("Stock adjusted", {
    actorId,
    repuestoId: data.repuestoId,
    movementId: movement.id,
    quantity: data.quantity,
  });

  return movement;
}

export async function setWorkOrderPartUsage(workOrderId: string, input: unknown, actorId: string) {
  const data = setWorkOrderPartUsageSchema.parse(input);

  const partUsage = await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        id: true,
        orderNumber: true,
        vehicleId: true,
        vehicle: {
          select: {
            vin: true,
          },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundError("Orden de trabajo no encontrada");
    }

    const existing = await tx.workOrderPart.findUnique({
      where: {
        workOrderId_repuestoId: {
          workOrderId,
          repuestoId: data.repuestoId,
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    const previousQuantity = existing?.quantity ?? 0;
    const quantityDelta = data.quantity - previousQuantity;

    if (quantityDelta > 0) {
      await applyStockMovement(tx, {
        repuestoId: data.repuestoId,
        type: StockMovementType.OUT,
        quantity: -quantityDelta,
        reason: `Consumo en orden ${workOrder.orderNumber}`,
        sourceType: StockMovementSourceType.WORK_ORDER,
        sourceId: workOrderId,
        createdById: actorId,
      });
    }

    if (quantityDelta < 0) {
      await applyStockMovement(tx, {
        repuestoId: data.repuestoId,
        type: StockMovementType.ADJUSTMENT,
        quantity: Math.abs(quantityDelta),
        reason: `Correccion de consumo en orden ${workOrder.orderNumber}`,
        sourceType: StockMovementSourceType.WORK_ORDER,
        sourceId: workOrderId,
        createdById: actorId,
      });
    }

    if (data.quantity === 0) {
      if (existing) {
        await tx.workOrderPart.delete({
          where: { id: existing.id },
        });
      }

      return null;
    }

    if (existing) {
      const updatedPart = await tx.workOrderPart.update({
        where: { id: existing.id },
        data: {
          quantity: data.quantity,
        },
      });

      if (isValidVinFormat(workOrder.vehicle.vin)) {
        await tx.vehiclePartCompatibility.upsert({
          where: {
            vehicleId_repuestoId: {
              vehicleId: workOrder.vehicleId,
              repuestoId: data.repuestoId,
            },
          },
          create: {
            vehicleId: workOrder.vehicleId,
            repuestoId: data.repuestoId,
            source: VehiclePartCompatibilitySource.WORK_ORDER,
            notes: `Aprendida desde orden ${workOrder.orderNumber}`,
          },
          update: {},
        });
      }

      return updatedPart;
    }

    const createdPart = await tx.workOrderPart.create({
      data: {
        workOrderId,
        repuestoId: data.repuestoId,
        quantity: data.quantity,
        createdById: actorId,
      },
    });

    if (isValidVinFormat(workOrder.vehicle.vin)) {
      await tx.vehiclePartCompatibility.upsert({
        where: {
          vehicleId_repuestoId: {
            vehicleId: workOrder.vehicleId,
            repuestoId: data.repuestoId,
          },
        },
        create: {
          vehicleId: workOrder.vehicleId,
          repuestoId: data.repuestoId,
          source: VehiclePartCompatibilitySource.WORK_ORDER,
          notes: `Aprendida desde orden ${workOrder.orderNumber}`,
        },
        update: {},
      });
    }

    return createdPart;
  });

  inventoryLogger.info("Work order part usage updated", {
    actorId,
    workOrderId,
    repuestoId: data.repuestoId,
    quantity: data.quantity,
    partUsageId: partUsage?.id,
  });

  return partUsage;
}
