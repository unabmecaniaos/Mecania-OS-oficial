import { UserRole, WorkOrderStatus } from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
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
import { findLatestInsuranceCaseLink } from "@/modules/insurance-cases/insurance-case.service";
import { listMechanics } from "@/modules/users/user.service";

const workOrderLogger = createLogger("work-orders");

async function assertClientVehicleMatch(clientId: string, vehicleId: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      deletedAt: null,
    },
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
  const insuranceCase = await findLatestInsuranceCaseLink(data.clientId, data.vehicleId);

  const workOrder = await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.create({
      data: {
        orderNumber,
        clientId: data.clientId,
        vehicleId: data.vehicleId,
        insuranceCaseId: insuranceCase?.id,
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

  workOrderLogger.info("Work order created", {
    actorId,
    workOrderId: workOrder.id,
    orderNumber: workOrder.orderNumber,
    status: workOrder.status,
  });

  return workOrder;
}

export async function updateWorkOrderAssignment(id: string, input: unknown, actorId: string) {
  const data = updateWorkOrderAssignmentSchema.parse(input);
  const existing = await workOrderRepository.findByIdForAssignment(id);

  if (!existing) {
    throw new NotFoundError("Orden de trabajo no encontrada");
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: {
      assignedTechnicianId: data.assignedTechnicianId ?? null,
      updatedById: actorId,
    },
  });

  workOrderLogger.info("Work order assignment updated", {
    actorId,
    workOrderId: workOrder.id,
    assignedTechnicianId: workOrder.assignedTechnicianId,
  });

  return workOrder;
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

  const evidence = await prisma.workOrderEvidence.create({
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

  workOrderLogger.info("Work order evidence uploaded", {
    actorId,
    workOrderId,
    evidenceId: evidence.id,
    fileName: evidence.fileName,
  });

  return evidence;
}

export async function getAssignableMechanics() {
  return listMechanics();
}

export async function updateWorkOrder(id: string, input: unknown, actorId: string) {
  const data = updateWorkOrderSchema.parse(input);
  const existing = await prisma.workOrder.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existing) {
    throw new NotFoundError("Orden de trabajo no encontrada");
  }

  const nextStatus = data.status ?? existing.status;

  const workOrder = await prisma.$transaction(async (tx) => {
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

  workOrderLogger.info("Work order updated", {
    actorId,
    workOrderId: workOrder.id,
    status: workOrder.status,
  });

  return workOrder;
}

export async function updateWorkOrderStatus(id: string, input: unknown, actorId: string) {
  const data = updateWorkOrderStatusSchema.parse(input);
  const existing = await prisma.workOrder.findFirst({
    where: {
      id,
      deletedAt: null,
    },
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

  const workOrder = await getWorkOrderById(id);

  workOrderLogger.info("Work order status updated", {
    actorId,
    workOrderId: workOrder.id,
    status: workOrder.status,
  });

  return workOrder;
}
