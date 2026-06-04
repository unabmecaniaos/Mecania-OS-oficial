import {
  WorkOrderAreaStatus,
  WorkOrderServiceFlow,
  WorkOrderStatus,
  WorkOrderTaskStatus,
} from "@prisma/client";
import { z } from "zod";

import { optionalDateOnly, optionalText, requiredText } from "@/lib/validation";

export const createWorkOrderSchema = z.object({
  clientId: requiredText(1, 40),
  vehicleId: requiredText(1, 40),
  assignedTechnicianId: optionalText(40),
  assignedPainterId: optionalText(40),
  reason: requiredText(5, 500),
  initialDiagnosis: optionalText(1000),
  status: z.nativeEnum(WorkOrderStatus).default(WorkOrderStatus.RECEIVED),
  serviceFlow: z.nativeEnum(WorkOrderServiceFlow).default(WorkOrderServiceFlow.MECHANICS),
  estimatedDate: optionalDateOnly(),
  notes: optionalText(1000),
});

export const updateWorkOrderSchema = z
  .object({
    assignedTechnicianId: optionalText(40),
    assignedPainterId: optionalText(40),
    reason: requiredText(5, 500).optional(),
    initialDiagnosis: optionalText(1000),
    status: z.nativeEnum(WorkOrderStatus).optional(),
    serviceFlow: z.nativeEnum(WorkOrderServiceFlow).optional(),
    mechanicsStatus: z.nativeEnum(WorkOrderAreaStatus).optional(),
    paintStatus: z.nativeEnum(WorkOrderAreaStatus).optional(),
    estimatedDate: optionalDateOnly(),
    notes: optionalText(1000),
  })
  .refine((value) => Object.keys(value).length > 0, "Debe enviar datos para actualizar");

export const updateWorkOrderStatusSchema = z.object({
  status: z.nativeEnum(WorkOrderStatus),
  note: optionalText(500),
});

export const updateWorkOrderAssignmentSchema = z.object({
  assignedTechnicianId: optionalText(40),
  assignedPainterId: optionalText(40),
});

export const updateWorkOrderFlowSchema = z.object({
  serviceFlow: z.nativeEnum(WorkOrderServiceFlow),
  assignedTechnicianId: optionalText(40),
  assignedPainterId: optionalText(40),
  mechanicsStatus: z.nativeEnum(WorkOrderAreaStatus),
  paintStatus: z.nativeEnum(WorkOrderAreaStatus),
});

export const createWorkOrderTaskSchema = z.object({
  title: requiredText(3, 160),
  description: optionalText(800),
});

export const updateWorkOrderTaskStatusSchema = z.object({
  status: z.nativeEnum(WorkOrderTaskStatus),
});

export const updateWorkOrderPromisedDateSchema = z.object({
  estimatedDate: optionalDateOnly(),
});
