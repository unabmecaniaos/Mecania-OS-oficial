import { z } from "zod";

import { optionalText, requiredText } from "@/lib/validation";

const MAX_STOCK_QUANTITY = 1_000_000;

function integerFromForm() {
  return z.preprocess((value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();

      if (!trimmed) {
        return undefined;
      }

      return Number(trimmed);
    }

    return value;
  }, z.number().int().min(-MAX_STOCK_QUANTITY).max(MAX_STOCK_QUANTITY));
}

const nonNegativeStock = integerFromForm().pipe(
  z.number().int().min(0, "El stock no puede ser negativo").max(MAX_STOCK_QUANTITY),
);

const positiveQuantity = integerFromForm().pipe(
  z.number().int().min(1, "La cantidad debe ser mayor a 0").max(MAX_STOCK_QUANTITY),
);

export const createRepuestoSchema = z.object({
  name: requiredText(2, 120),
  code: requiredText(1, 80).transform((value) => value.toUpperCase()),
  unitPrice: nonNegativeStock,
  initialStock: nonNegativeStock,
  minimumStock: nonNegativeStock,
  compatibleVehicleId: optionalText(40),
});

export const registerStockEntrySchema = z.object({
  repuestoId: requiredText(1, 40),
  quantity: positiveQuantity,
  reason: optionalText(500),
});

export const adjustStockSchema = z.object({
  repuestoId: requiredText(1, 40),
  quantity: integerFromForm()
    .refine((value) => value !== 0, "El ajuste no puede ser 0")
    .pipe(z.number().int().min(-MAX_STOCK_QUANTITY).max(MAX_STOCK_QUANTITY)),
  reason: requiredText(3, 500),
});

export const setWorkOrderPartUsageSchema = z.object({
  repuestoId: requiredText(1, 40),
  quantity: nonNegativeStock,
});

export const assignPartCompatibilitySchema = z.object({
  repuestoId: requiredText(1, 40),
  vehicleId: requiredText(1, 40),
  notes: optionalText(500),
});
