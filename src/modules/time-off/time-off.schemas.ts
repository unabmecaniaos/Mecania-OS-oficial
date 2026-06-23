import { TimeOffRequestStatus, TimeOffRequestType } from "@prisma/client";
import { z } from "zod";

import { optionalDateOnly, optionalText, requiredText } from "@/lib/validation";

export const createTimeOffRequestSchema = z
  .object({
    type: z.nativeEnum(TimeOffRequestType),
    startDate: requiredText(10, 10),
    endDate: requiredText(10, 10),
    reason: optionalText(800),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "La fecha de termino debe ser igual o posterior a la fecha de inicio",
    path: ["endDate"],
  });

export const reviewTimeOffRequestSchema = z.object({
  status: z.enum([TimeOffRequestStatus.APPROVED, TimeOffRequestStatus.REJECTED]),
  reviewNote: optionalText(800),
});

export const timeOffFilterSchema = z.object({
  mechanicId: optionalText(40),
  startDate: optionalDateOnly(),
  endDate: optionalDateOnly(),
});
