import { z } from "zod";
import { BudgetStatus } from "@prisma/client";

import { optionalText, requiredInteger, requiredText } from "@/lib/validation";

export const createWorkshopBudgetSchema = z
  .object({
    clientId: optionalText(40),
    vehicleId: optionalText(40),
    selfInspectionId: optionalText(40),
    title: requiredText(5, 120),
    summary: optionalText(1200),
  })
  .superRefine((data, context) => {
    if (data.selfInspectionId) {
      return;
    }

    if (!data.clientId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes seleccionar un cliente del taller o una autoinspeccion revisada",
        path: ["clientId"],
      });
    }

    if (!data.vehicleId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes seleccionar un vehiculo o una autoinspeccion revisada",
        path: ["vehicleId"],
      });
    }
  });

export const createLiquidatorBudgetSchema = z.object({
  insuranceCaseId: requiredText(1, 40),
  title: requiredText(5, 120),
  summary: optionalText(1200),
});

export const updateBudgetDraftSchema = z.object({
  title: requiredText(5, 120),
  summary: optionalText(1200),
});

export const budgetLineUpdateSchema = z.object({
  quantity: requiredInteger(1, 999),
  unitPrice: requiredInteger(0, 50_000_000),
  note: optionalText(400),
});

export const transitionBudgetStatusSchema = z.object({
  nextStatus: z.nativeEnum(BudgetStatus),
  note: optionalText(400),
});
