import { QuoteItemType, QuoteRecipientType, QuoteStatus } from "@prisma/client";
import { z } from "zod";

import { optionalText, requiredText } from "@/lib/validation";

function decimalInput(message: string, minimum = 0) {
  return z.preprocess((value) => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized === "" ? undefined : Number(normalized);
    }

    return value;
  }, z.number().finite().min(minimum, message));
}

export const quoteItemSchema = z.object({
  type: z.nativeEnum(QuoteItemType),
  description: requiredText(2, 255),
  quantity: decimalInput("La cantidad debe ser mayor a cero", 0.01),
  unitPrice: decimalInput("El valor unitario no puede ser negativo", 0),
});

export const createQuoteSchema = z
  .object({
    clientId: optionalText(40),
    vehicleId: optionalText(40),
    selfInspectionId: optionalText(40),
    recipientType: z.nativeEnum(QuoteRecipientType).default(QuoteRecipientType.CUSTOMER),
    summary: optionalText(500),
    internalNotes: optionalText(2000),
    items: z.array(quoteItemSchema).min(1, "Debes agregar al menos un item al presupuesto"),
  })
  .superRefine((data, context) => {
    if (!data.selfInspectionId && !data.clientId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes seleccionar un cliente o una autoinspeccion revisada",
        path: ["clientId"],
      });
    }

    if (!data.selfInspectionId && !data.vehicleId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes seleccionar un vehiculo o una autoinspeccion revisada",
        path: ["vehicleId"],
      });
    }
  });

export const listQuoteFiltersSchema = z.object({
  q: optionalText(100),
  status: z.nativeEnum(QuoteStatus).optional(),
  recipient: z.nativeEnum(QuoteRecipientType).optional(),
});

export const transitionQuoteSchema = z.object({
  note: optionalText(500),
});
