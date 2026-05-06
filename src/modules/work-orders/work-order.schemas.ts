import { WorkOrderStatus } from "@prisma/client";
import { z } from "zod";

import { optionalDateOnly, optionalText, requiredText } from "@/lib/validation";

export const createWorkOrderSchema = z.object({
  clientId: requiredText(1, 40),
  vehicleId: requiredText(1, 40),
  assignedTechnicianId: optionalText(40),
  reason: requiredText(5, 500),
  initialDiagnosis: optionalText(1000),
  status: z.nativeEnum(WorkOrderStatus).default(WorkOrderStatus.RECEIVED),
  estimatedDate: optionalDateOnly(),
  notes: optionalText(1000),
});

export const updateWorkOrderSchema = z
  .object({
    assignedTechnicianId: optionalText(40),
    reason: requiredText(5, 500).optional(),
    initialDiagnosis: optionalText(1000),
    status: z.nativeEnum(WorkOrderStatus).optional(),
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
});
