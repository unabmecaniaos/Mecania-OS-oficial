import { z } from "zod";

import {
  optionalInteger,
  optionalText,
  requiredInteger,
  requiredText,
} from "@/lib/validation";
import { vinSchema } from "@/lib/vin";

const currentYear = new Date().getFullYear() + 1;

export const createVehicleSchema = z.object({
  clientId: requiredText(1, 40),
  plate: optionalText(16).transform((value) => value?.toUpperCase()),
  vin: vinSchema,
  make: requiredText(2, 80),
  model: requiredText(1, 80),
  year: requiredInteger(1950, currentYear),
  color: optionalText(40),
  mileage: optionalInteger(),
});

export const updateVehicleSchema = createVehicleSchema
  .omit({ clientId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Debe enviar datos para actualizar");
