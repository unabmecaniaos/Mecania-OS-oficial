import { MechanicPaymentConcept } from "@prisma/client";
import { z } from "zod";

import { optionalDateOnly, optionalText, requiredInteger, requiredText } from "@/lib/validation";

export const createMechanicPaymentSchema = z.object({
  mechanicId: requiredText(1, 40),
  concept: z.nativeEnum(MechanicPaymentConcept),
  amount: requiredInteger(1, 100_000_000),
  paidAt: requiredText(10, 10),
  note: optionalText(800),
});

export const payrollFilterSchema = z.object({
  mechanicId: optionalText(40),
  from: optionalDateOnly(),
  to: optionalDateOnly(),
});
