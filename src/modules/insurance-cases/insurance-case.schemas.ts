import { z } from "zod";

import { optionalDateOnly, optionalText, requiredText } from "@/lib/validation";

export const createInsuranceCaseSchema = z.object({
  ownerFullName: requiredText(3, 160),
  ownerPhone: requiredText(6, 32),
  ownerEmail: optionalText(255),
  ownerAddress: optionalText(255),
  plate: optionalText(16),
  vin: requiredText(6, 32),
  make: requiredText(2, 80),
  model: requiredText(1, 80),
  year: z.coerce.number().int().min(1900).max(2100),
  color: optionalText(60),
  claimNumber: optionalText(64),
  policyNumber: optionalText(64),
  incidentDate: optionalDateOnly(),
  incidentLocation: optionalText(255),
  description: requiredText(10, 1500),
});
