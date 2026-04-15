import { SelfInspectionStatus, UserRole, WorkOrderStatus, type QuoteItemType } from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { parseDateInput } from "@/lib/utils";
import { isClosedStatus } from "@/modules/work-orders/work-order.constants";
import { workOrderRepository } from "@/modules/work-orders/work-order.repository";
import {
  createWorkOrderSchema,
  updateWorkOrderAssignmentSchema,
  updateWorkOrderSchema,
  updateWorkOrderStatusSchema,
} from "@/modules/work-orders/work-order.schemas";
import { saveWorkOrderEvidenceFile } from "@/modules/work-orders/work-order.storage";
import { listMechanics } from "@/modules/users/user.service";

const QUOTE_ITEM_TYPE_LABELS: Record<QuoteItemType, string> = {
  LABOR: "Mano de obra",
  PART: "Repuesto",
  SUPPLY: "Insumo",
};

async function assertClientVehicleMatch(clientId: string, vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      clientId: true,
    },
  });

  if (!vehicle) {
    throw new NotFoundError("Vehiculo no encontrado");
  }

  if (vehicle.clientId !== clientId) {
    throw new ConflictError("El vehiculo no pertenece al cliente seleccionado");
  }
}

async function getNextOrderNumber() {
  const year = new Date().getFullYear();
  const prefix = `OT-${year}-`;
  const lastOrder = await workOrderRepository.findLastOrderNumberForYear(prefix);
  const nextSequence = lastOrder ? Number(lastOrder.orderNumber.slice(-4)) + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

function compactText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildWorkOrderReasonFromQuote(quote: {
  quoteNumber: string;
  summary: string | null;
  items: Array<{ description: string }>;
}) {
  const summary = compactText(quote.summary);

  if (summary) {
    return truncateText(summary, 500);
  }

  const firstItem = quote.items.find((item) => compactText(item.description));

  if (firstItem) {
    return truncateText(`Trabajo autorizado: ${firstItem.description.trim()}`, 500);
  }

  return `Trabajo autorizado desde presupuesto ${quote.quoteNumber}`;
}

function buildWorkOrderNotesFromQuote(quote: {
  quoteNumber: string;
  internalNotes: string | null;
  items: Array<{
    type: QuoteItemType;
    description: string;
    quantity: Prisma.Decimal;
  }>;
  selfInspection: {
    id: string;
    summaryGenerated: string | null;
  } | null;
}) {
  const itemsSummary = quote.items
    .slice(0, 6)
    .map(
      (item) =>
        `${QUOTE_ITEM_TYPE_LABELS[item.type]}: ${item.description} (${item.quantity.toString()} u.)`,
    )
    .join("; ");

  const segments = [
    `Creada desde presupuesto ${quote.quoteNumber}.`,
    compactText(quote.internalNotes)
      ? `Notas internas del presupuesto: ${compactText(quote.internalNotes)}`
      : null,
    itemsSummary ? `Items aprobados: ${itemsSummary}` : null,
    compactText(quote.selfInspection?.summaryGenerated)
      ? `Resumen de autoinspeccion: ${compactText(quote.selfInspection?.summaryGenerated)}`
      : null,
  ].filter((segment): segment is string => Boolean(segment));

  return truncateText(segments.join("\n\n"), 1000);
}

export async function listWorkOrders(input?: {
  search?: string;
  status?: WorkOrderStatus;
  actorId?: string;
  actorRole?: UserRole;
}) {
  return workOrderRepository.list({
    search: input?.search?.trim(),
    status: input?.status,
    actorId: input?.actorId,
    actorRole: input?.actorRole,
  });
}

export async function getWorkOrderById(id: string) {
  const workOrder = await workOrderRepository.findById(id);

  if (!workOrder) {
    throw new NotFoundError("Orden de trabajo no encontrada");
  }

  return workOrder;
}

export async function createWorkOrder(input: unknown, actorId: string) {
  const data = createWorkOrderSchema.parse(input);
  await assertClientVehicleMatch(data.clientId, data.vehicleId);

  const orderNumber = await getNextOrderNumber();

  return prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.create({
      data: {
        orderNumber,
        clientId: data.clientId,
        vehicleId: data.vehicleId,
        reason: data.reason,
        initialDiagnosis: data.initialDiagnosis,
        status: data.status,
        estimatedDate: parseDateInput(data.estimatedDate),
        notes: data.notes,
        createdById: actorId,
        updatedById: actorId,
        assignedTechnicianId: data.assignedTechnicianId,
      },
    });

    await tx.workOrderStatusLog.create({
      data: {
        workOrderId: workOrder.id,
        previousStatus: null,
        nextStatus: data.status,
        note: "Estado inicial de la orden",
        changedById: actorId,
      },
    });

    return workOrder;
  });
}

export async function createWorkOrderFromQuote(quoteId: string, actorId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      quoteNumber: true,
      status: true,
      clientId: true,
      vehicleId: true,
      summary: true,
      internalNotes: true,
      selfInspectionId: true,
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
        },
      },
      selfInspection: {
        select: {
          id: true,
          status: true,
          workOrderId: true,
          summaryGenerated: true,
        },
      },
      items: {
        select: {
          type: true,
          description: true,
          quantity: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
  });

  if (!quote) {
    throw new NotFoundError("Presupuesto no encontrado");
  }

  if (quote.status !== WorkOrderStatus.RECEIVED && quote.status !== undefined) {
    // noop guard to keep exhaustive typing stable after Prisma enum updates
  }

  if (quote.status !== "APPROVED") {
    throw new ConflictError("Solo un presupuesto aprobado puede convertirse en orden de trabajo");
  }

  if (quote.workOrder) {
    throw new ConflictError(
      `El presupuesto ya esta vinculado a la orden ${quote.workOrder.orderNumber}`,
    );
  }

  if (quote.selfInspection?.workOrderId) {
    throw new ConflictError("La autoinspeccion asociada ya fue convertida en una orden de trabajo");
  }

  const orderNumber = await getNextOrderNumber();
  const reason = buildWorkOrderReasonFromQuote(quote);
  const initialDiagnosis =
    compactText(quote.internalNotes) ?? compactText(quote.selfInspection?.summaryGenerated);
  const notes = buildWorkOrderNotesFromQuote(quote);

  const createdWorkOrder = await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.create({
      data: {
        quoteId: quote.id,
        orderNumber,
        clientId: quote.clientId,
        vehicleId: quote.vehicleId,
        reason,
        initialDiagnosis,
        status: WorkOrderStatus.RECEIVED,
        notes,
        createdById: actorId,
        updatedById: actorId,
      },
      select: {
        id: true,
      },
    });

    await tx.workOrderStatusLog.create({
      data: {
        workOrderId: workOrder.id,
        previousStatus: null,
        nextStatus: WorkOrderStatus.RECEIVED,
        note: `Orden creada desde presupuesto aprobado ${quote.quoteNumber}`,
        changedById: actorId,
      },
    });

    if (quote.selfInspectionId && quote.selfInspection) {
      await tx.selfInspection.update({
        where: {
          id: quote.selfInspectionId,
        },
        data: {
          workOrderId: workOrder.id,
          status: SelfInspectionStatus.CONVERTED_TO_WORK_ORDER,
        },
      });

      await tx.selfInspectionStatusLog.create({
        data: {
          selfInspectionId: quote.selfInspectionId,
          previousStatus: quote.selfInspection.status,
          nextStatus: SelfInspectionStatus.CONVERTED_TO_WORK_ORDER,
          note: `Autoinspeccion convertida en la orden ${orderNumber} desde presupuesto aprobado`,
          changedById: actorId,
        },
      });
    }

    return workOrder;
  });

  return getWorkOrderById(createdWorkOrder.id);
}

export async function updateWorkOrderAssignment(id: string, input: unknown, actorId: string) {
  const data = updateWorkOrderAssignmentSchema.parse(input);
  const existing = await workOrderRepository.findByIdForAssignment(id);

  if (!existing) {
    throw new NotFoundError("Orden de trabajo no encontrada");
  }

  return prisma.workOrder.update({
    where: { id },
    data: {
      assignedTechnicianId: data.assignedTechnicianId ?? null,
      updatedById: actorId,
    },
  });
}

export async function addWorkOrderEvidence(workOrderId: string, input: { file: File; note?: string }, actorId: string) {
  const workOrder = await workOrderRepository.findByIdForAssignment(workOrderId);

  if (!workOrder) {
    throw new NotFoundError("Orden de trabajo no encontrada");
  }

  const savedFile = await saveWorkOrderEvidenceFile({
    workOrderId,
    file: input.file,
  });

  return prisma.workOrderEvidence.create({
    data: {
      workOrderId,
      uploadedById: actorId,
      fileUrl: savedFile.fileUrl,
      storageKey: savedFile.storageKey,
      fileName: savedFile.fileName,
      mimeType: savedFile.mimeType,
      sizeBytes: savedFile.sizeBytes,
      note: input.note?.trim() ? input.note.trim() : null,
    },
  });
}

export async function getAssignableMechanics() {
  return listMechanics();
}

export async function updateWorkOrder(id: string, input: unknown, actorId: string) {
  const data = updateWorkOrderSchema.parse(input);
  const existing = await prisma.workOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existing) {
    throw new NotFoundError("Orden de trabajo no encontrada");
  }

  const nextStatus = data.status ?? existing.status;

  return prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.update({
      where: { id },
      data: {
        reason: data.reason,
        initialDiagnosis: data.initialDiagnosis,
        status: nextStatus,
        estimatedDate:
          data.estimatedDate === undefined ? undefined : parseDateInput(data.estimatedDate),
        notes: data.notes,
        updatedById: actorId,
        closedDate: isClosedStatus(nextStatus) ? new Date() : null,
      },
    });

    if (data.status && data.status !== existing.status) {
      await tx.workOrderStatusLog.create({
        data: {
          workOrderId: id,
          previousStatus: existing.status,
          nextStatus: data.status,
          note: "Cambio de estado desde edicion de orden",
          changedById: actorId,
        },
      });
    }

    return workOrder;
  });
}

export async function updateWorkOrderStatus(id: string, input: unknown, actorId: string) {
  const data = updateWorkOrderStatusSchema.parse(input);
  const existing = await prisma.workOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existing) {
    throw new NotFoundError("Orden de trabajo no encontrada");
  }

  if (existing.status === data.status) {
    return getWorkOrderById(id);
  }

  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id },
      data: {
        status: data.status,
        updatedById: actorId,
        closedDate: isClosedStatus(data.status) ? new Date() : null,
      },
    });

    await tx.workOrderStatusLog.create({
      data: {
        workOrderId: id,
        previousStatus: existing.status,
        nextStatus: data.status,
        note: data.note,
        changedById: actorId,
      },
    });
  });

  return getWorkOrderById(id);
}
