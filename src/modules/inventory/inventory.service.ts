import {
  Prisma,
  StockMovementSourceType,
  StockMovementType,
} from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { inventoryRepository } from "@/modules/inventory/inventory.repository";
import {
  adjustStockSchema,
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
      return tx.workOrderPart.update({
        where: { id: existing.id },
        data: {
          quantity: data.quantity,
        },
      });
    }

    return tx.workOrderPart.create({
      data: {
        workOrderId,
        repuestoId: data.repuestoId,
        quantity: data.quantity,
        createdById: actorId,
      },
    });
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
