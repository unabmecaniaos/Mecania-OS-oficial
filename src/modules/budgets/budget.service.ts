import { BudgetItemType, BudgetStatus, WorkOrderStatus } from "@prisma/client";

import { AppError, ConflictError, NotFoundError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { budgetRepository } from "@/modules/budgets/budget.repository";
import { findLatestInsuranceCaseLink } from "@/modules/insurance-cases/insurance-case.service";
import {
  budgetLineUpdateSchema,
  createLiquidatorBudgetSchema,
  createWorkshopBudgetSchema,
  transitionBudgetStatusSchema,
  updateBudgetDraftSchema,
} from "@/modules/budgets/budget.schemas";

const budgetLogger = createLogger("budgets");

type DraftCatalogSelection = {
  source: "inventoryPart" | "referenceCatalog";
  itemType: BudgetItemType;
  itemId: string;
  quantity: number;
};

type DraftManualSelection = {
  itemType: BudgetItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  note?: string;
};

type DraftLineUpdate = {
  id: string;
  quantity: number;
  unitPrice: number;
  note?: string;
};

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfToday(start: Date) {
  const value = new Date(start);
  value.setDate(value.getDate() + 1);
  return value;
}

async function createBudgetNumber() {
  const start = startOfToday();
  const end = endOfToday(start);
  const count = await budgetRepository.countCreatedToday(start, end);
  const stamp = start.toISOString().slice(0, 10).replace(/-/g, "");

  return `PRES-${stamp}-${String(count + 1).padStart(3, "0")}`;
}

async function createWorkOrderNumber() {
  const year = new Date().getFullYear();
  const prefix = `OT-${year}-`;
  const lastOrder = await prisma.workOrder.findFirst({
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
  const nextSequence = lastOrder ? Number(lastOrder.orderNumber.slice(-4)) + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

function calculateTotals(
  items: Array<{ itemType: BudgetItemType; quantity: number; unitPrice: number }>,
) {
  const subtotalParts = items
    .filter((item) => item.itemType === BudgetItemType.PART)
    .reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const subtotalLabor = items
    .filter((item) => item.itemType === BudgetItemType.LABOR)
    .reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const subtotalSupplies = items
    .filter((item) => item.itemType === BudgetItemType.SUPPLY)
    .reduce((total, item) => total + item.quantity * item.unitPrice, 0);

  return {
    subtotalParts,
    subtotalLabor,
    subtotalSupplies,
    totalAmount: subtotalParts + subtotalLabor + subtotalSupplies,
  };
}

const ALLOWED_STATUS_TRANSITIONS: Record<BudgetStatus, BudgetStatus[]> = {
  [BudgetStatus.DRAFT]: [BudgetStatus.SENT],
  [BudgetStatus.SENT]: [
    BudgetStatus.APPROVED,
    BudgetStatus.REJECTED,
    BudgetStatus.REQUEST_CHANGES,
    BudgetStatus.PARTIALLY_APPROVED,
  ],
  [BudgetStatus.APPROVED]: [BudgetStatus.CONVERTED_TO_WORK_ORDER],
  [BudgetStatus.REQUEST_CHANGES]: [BudgetStatus.SENT],
  [BudgetStatus.PARTIALLY_APPROVED]: [BudgetStatus.CONVERTED_TO_WORK_ORDER],
  [BudgetStatus.REJECTED]: [],
  [BudgetStatus.CONVERTED_TO_WORK_ORDER]: [],
};

function ensureStatusTransition(current: BudgetStatus, next: BudgetStatus) {
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[current];

  if (!allowedTransitions.includes(next)) {
    throw new AppError("La transicion de estado solicitada no es valida", 422);
  }
}

export async function listBudgets(search?: string) {
  const budgets = await budgetRepository.list(search);

  return {
    budgets,
    summary: {
      total: budgets.length,
      drafts: budgets.filter((budget) => budget.status === BudgetStatus.DRAFT).length,
      sent: budgets.filter((budget) => budget.status === BudgetStatus.SENT).length,
      approved: budgets.filter((budget) => budget.status === BudgetStatus.APPROVED).length,
    },
  };
}

export async function getWorkshopBudgetCreateContext() {
  const [clients, references, inventoryParts, selfInspections] =
    await budgetRepository.listWorkshopCreateContext();

  return {
    clients,
    vehicles: clients.flatMap((client) =>
      client.vehicles.map((vehicle) => ({
        ...vehicle,
        clientName: client.fullName,
      })),
    ),
    references,
    inventoryParts,
    selfInspections,
  };
}

export async function getLiquidatorBudgetCreateContext() {
  const [references, inventoryParts, insuranceCases] =
    await budgetRepository.listLiquidatorCreateContext();

  return {
    insuranceCases,
    references,
    inventoryParts,
  };
}

export async function getBudgetById(id: string) {
  const budget = await budgetRepository.findById(id);

  if (!budget) {
    throw new NotFoundError("Presupuesto no encontrado");
  }

  return budget;
}

function buildDraftItems(
  references: Awaited<ReturnType<typeof budgetRepository.listWorkshopCreateContext>>[1],
  inventoryParts: Awaited<ReturnType<typeof budgetRepository.listWorkshopCreateContext>>[2],
  selections: DraftCatalogSelection[],
  manualSelections: DraftManualSelection[],
) {
  const selectedCatalogItems = selections
    .map((selection) => {
      if (selection.source === "inventoryPart") {
        const repuesto = inventoryParts.find((entry) => entry.id === selection.itemId);

        if (!repuesto) {
          return null;
        }

        return {
          itemType: BudgetItemType.PART,
          description: repuesto.name,
          referenceCode: repuesto.code,
          quantity: selection.quantity,
          unitPrice: repuesto.unitPrice,
          subtotal: selection.quantity * repuesto.unitPrice,
          sourceLabel: "Inventario",
          note:
            repuesto.currentStock > 0
              ? `Precio tomado desde inventario. Stock actual: ${repuesto.currentStock}.`
              : "Precio tomado desde inventario.",
        };
      }

      const reference = references.find((entry) => entry.id === selection.itemId);

      if (!reference) {
        return null;
      }

      return {
        referenceCatalogId: reference.id,
        itemType: reference.itemType,
        description: reference.name,
        referenceCode: reference.referenceCode ?? undefined,
        quantity: selection.quantity,
        unitPrice: reference.unitPrice,
        subtotal: selection.quantity * reference.unitPrice,
        sourceLabel: reference.sourceLabel,
        sourceUrl: reference.sourceUrl ?? undefined,
        note: `Valor referencial real tomado desde ${reference.sourceLabel}.`,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const manualItems = manualSelections.map((selection) => ({
    itemType: selection.itemType,
    description: selection.description,
    quantity: selection.quantity,
    unitPrice: selection.unitPrice,
    subtotal: selection.quantity * selection.unitPrice,
    sourceLabel: "Ingreso manual",
    note: selection.note || "Item agregado manualmente fuera del catalogo.",
  }));

  if (selectedCatalogItems.length === 0 && manualItems.length === 0) {
    throw new AppError("Debes seleccionar al menos un repuesto o servicio para el presupuesto", 422);
  }

  return [...selectedCatalogItems, ...manualItems];
}

export async function createWorkshopBudgetDraft(
  input: unknown,
  selections: DraftCatalogSelection[],
  manualSelections: DraftManualSelection[],
  actorId: string,
) {
  const data = createWorkshopBudgetSchema.parse(input);
  const { clients, references, inventoryParts, selfInspections } =
    await getWorkshopBudgetCreateContext();

  let clientId = data.clientId ?? "";
  let vehicleId = data.vehicleId ?? "";
  let selfInspectionId: string | undefined;

  if (data.selfInspectionId) {
    const selfInspection = selfInspections.find((entry) => entry.id === data.selfInspectionId);

    if (!selfInspection || !selfInspection.vehicle) {
      throw new AppError(
        "La autoinspeccion seleccionada debe estar revisada y vinculada a un vehiculo",
        422,
      );
    }

    clientId = selfInspection.customerId;
    vehicleId = selfInspection.vehicleId ?? "";
    selfInspectionId = selfInspection.id;
  } else {
    const client = clients.find((entry) => entry.id === clientId);

    if (!client) {
      throw new NotFoundError("Cliente no encontrado");
    }

    const vehicle = client.vehicles.find((entry) => entry.id === vehicleId);

    if (!vehicle) {
      throw new AppError("El vehiculo seleccionado no pertenece al cliente indicado", 422);
    }
  }

  const draftItems = buildDraftItems(references, inventoryParts, selections, manualSelections);
  const totals = calculateTotals(draftItems);
  const insuranceCase = await findLatestInsuranceCaseLink(clientId, vehicleId);

  const budget = await budgetRepository.createDraft({
    budgetNumber: await createBudgetNumber(),
    clientId,
    vehicleId,
    insuranceCaseId: insuranceCase?.id,
    selfInspectionId,
    title: data.title,
    summary: data.summary,
    createdById: actorId,
    items: draftItems,
    ...totals,
  });

  budgetLogger.info("Budget draft created", {
    actorId,
    budgetId: budget.id,
    budgetNumber: budget.budgetNumber,
    totalAmount: budget.totalAmount,
  });

  return budget;
}

export async function createLiquidatorBudgetDraft(
  input: unknown,
  selections: DraftCatalogSelection[],
  manualSelections: DraftManualSelection[],
  actorId: string,
) {
  const data = createLiquidatorBudgetSchema.parse(input);
  const { references, inventoryParts, insuranceCases } =
    await getLiquidatorBudgetCreateContext();
  const insuranceCase = insuranceCases.find((entry) => entry.id === data.insuranceCaseId);

  if (!insuranceCase) {
    throw new NotFoundError("Caso de liquidadora no encontrado");
  }

  const draftItems = buildDraftItems(references, inventoryParts, selections, manualSelections);
  const totals = calculateTotals(draftItems);

  return budgetRepository.createDraft({
    budgetNumber: await createBudgetNumber(),
    clientId: insuranceCase.clientId,
    vehicleId: insuranceCase.vehicleId,
    insuranceCaseId: insuranceCase.id,
    title: data.title,
    summary: data.summary,
    createdById: actorId,
    items: draftItems,
    ...totals,
  });
}

export async function updateBudgetDraft(
  budgetId: string,
  input: unknown,
  updates: DraftLineUpdate[],
  actorId: string,
) {
  const data = updateBudgetDraftSchema.parse(input);
  const currentBudget = await getBudgetById(budgetId);

  if (
    currentBudget.status !== BudgetStatus.DRAFT &&
    currentBudget.status !== BudgetStatus.REQUEST_CHANGES
  ) {
    throw new AppError(
      "Solo los presupuestos en borrador o con solicitud de cambios pueden editarse",
      422,
    );
  }

  const normalizedUpdates = updates.map((update) => ({
    id: update.id,
    ...budgetLineUpdateSchema.parse({
      quantity: update.quantity,
      unitPrice: update.unitPrice,
      note: update.note,
    }),
  }));

  const items = currentBudget.items.map((item) => {
    const update = normalizedUpdates.find((entry) => entry.id === item.id);

    if (!update) {
      return {
        itemType: item.itemType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      };
    }

    return {
      itemType: item.itemType,
      quantity: update.quantity,
      unitPrice: update.unitPrice,
    };
  });

  const totals = calculateTotals(items);

  const updatedBudget = await budgetRepository.updateDraft(budgetId, {
    title: data.title,
    summary: data.summary,
    updatedById: actorId,
    ...totals,
    items: normalizedUpdates.map((update) => ({
      id: update.id,
      quantity: update.quantity,
      unitPrice: update.unitPrice,
      subtotal: update.quantity * update.unitPrice,
      note: update.note,
    })),
  });

  budgetLogger.info("Budget draft updated", {
    actorId,
    budgetId: updatedBudget.id,
    totalAmount: updatedBudget.totalAmount,
  });

  return updatedBudget;
}

export async function transitionBudgetStatus(
  budgetId: string,
  input: unknown,
  actorId: string,
) {
  const data = transitionBudgetStatusSchema.parse(input);
  const budget = await getBudgetById(budgetId);
  const previousStatus = budget.status;

  ensureStatusTransition(previousStatus, data.nextStatus);

  if (budget.items.length === 0) {
    throw new AppError("No puedes cambiar el estado de un presupuesto sin items", 422);
  }

  if (previousStatus === BudgetStatus.DRAFT && data.nextStatus === BudgetStatus.SENT) {
    if (budget.totalAmount <= 0) {
      throw new AppError("El presupuesto debe tener un total valido antes de enviarse", 422);
    }
  }

  const updatedBudget = await budgetRepository.transitionStatus(budgetId, {
    previousStatus,
    nextStatus: data.nextStatus,
    note: data.note,
    changedById: actorId,
    changedAt: new Date(),
  });

  budgetLogger.info("Budget status transitioned", {
    actorId,
    budgetId: updatedBudget.id,
    previousStatus,
    nextStatus: updatedBudget.status,
  });

  return updatedBudget;
}

export async function createWorkOrderFromBudget(budgetId: string, actorId: string) {
  const budget = await getBudgetById(budgetId);

  if (
    budget.status !== BudgetStatus.APPROVED &&
    budget.status !== BudgetStatus.PARTIALLY_APPROVED
  ) {
    throw new AppError(
      "Solo los presupuestos aprobados o parcialmente aprobados pueden convertirse en orden de trabajo",
      422,
    );
  }

  if (budget.workOrderId || budget.workOrder) {
    throw new ConflictError("Este presupuesto ya tiene una orden de trabajo asociada");
  }

  const orderNumber = await createWorkOrderNumber();
  const summarizedItems = budget.items
    .map(
      (item) =>
        `${item.description} (${item.quantity} x ${item.unitPrice.toLocaleString("es-CL")})`,
    )
    .slice(0, 3)
    .join(", ");

  const workOrder = await prisma.$transaction(async (tx) => {
    if (!budget.client.isWorkshopClient) {
      const liquidatorName = budget.insuranceCase?.liquidator.name ?? "Liquidadora";
      await tx.client.update({
        where: {
          id: budget.clientId,
        },
        data: {
          isWorkshopClient: true,
          fullName: `Cliente de ${liquidatorName}`,
        },
      });
    }

    const workOrder = await tx.workOrder.create({
      data: {
        orderNumber,
        clientId: budget.clientId,
        vehicleId: budget.vehicleId,
        insuranceCaseId: budget.insuranceCaseId,
        reason: `Presupuesto aprobado ${budget.budgetNumber}: ${summarizedItems}`,
        initialDiagnosis:
          budget.summary ?? `Orden creada desde presupuesto aprobado ${budget.budgetNumber}.`,
        status: WorkOrderStatus.RECEIVED,
        notes:
          `OT generada desde presupuesto ${budget.budgetNumber}.\n` +
          `Total aprobado: ${budget.totalAmount.toLocaleString("es-CL")}.\n` +
          `Repuestos: ${budget.subtotalParts.toLocaleString("es-CL")}.\n` +
          `Mano de obra: ${budget.subtotalLabor.toLocaleString("es-CL")}.\n` +
          `Suministros: ${budget.subtotalSupplies.toLocaleString("es-CL")}.`,
        createdById: actorId,
        updatedById: actorId,
      },
    });

    await tx.workOrderStatusLog.create({
      data: {
        workOrderId: workOrder.id,
        previousStatus: null,
        nextStatus: WorkOrderStatus.RECEIVED,
        note: `Orden creada desde presupuesto aprobado ${budget.budgetNumber}.`,
        changedById: actorId,
      },
    });

    await tx.budget.update({
      where: { id: budget.id },
      data: {
        status: BudgetStatus.CONVERTED_TO_WORK_ORDER,
        workOrderId: workOrder.id,
        updatedById: actorId,
        statusLogs: {
          create: {
            previousStatus: budget.status,
            nextStatus: BudgetStatus.CONVERTED_TO_WORK_ORDER,
            note: `Orden ${workOrder.orderNumber} creada desde presupuesto aprobado.`,
            changedById: actorId,
          },
        },
      },
    });

    return workOrder;
  });

  budgetLogger.info("Budget converted to work order", {
    actorId,
    budgetId: budget.id,
    workOrderId: workOrder.id,
    workOrderNumber: workOrder.orderNumber,
  });

  return workOrder;
}
