import {
  ReviewRecommendedNextStep,
  SelfInspectionDepartment,
  SelfInspectionOperationalOutcome,
  SelfInspectionPhotoType,
  SelfInspectionRiskLevel,
  SelfInspectionSource,
  SelfInspectionStatus,
} from "@prisma/client";
import { z } from "zod";

import { optionalText, requiredInteger, requiredText } from "@/lib/validation";

const currentYear = new Date().getFullYear() + 1;
const relaxedPlateRegex = /^[A-Z0-9]{5,8}$/;

function emptyToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

function requiredBoolean(message: string) {
  return z.preprocess((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    return value;
  }, z.boolean({ error: message }));
}

function numberFromUnknown(min: number, max: number) {
  return z.preprocess((value) => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      return Number(value);
    }

    return value;
  }, z.number().int().min(min).max(max));
}

export function normalizePlate(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export function normalizeVin(value: string) {
  return value.trim().toUpperCase();
}

export const plateSchema = z
  .string()
  .trim()
  .transform(normalizePlate)
  .refine(
    (value) => relaxedPlateRegex.test(value),
    "La patente debe tener entre 5 y 8 caracteres alfanumericos",
  );

export const selfInspectionVehicleStepSchema = z.object({
  fullName: requiredText(3, 120),
  phone: requiredText(6, 32),
  email: z.email().trim(),
  plate: plateSchema,
  vin: requiredText(8, 32).transform(normalizeVin),
  make: requiredText(1, 80),
  model: requiredText(1, 80),
  year: requiredInteger(1950, currentYear),
  mileage: requiredInteger(0, 2_000_000),
});

export const selfInspectionReasonStepSchema = z.object({
  problemType: z.enum([
    "MOTOR",
    "BRAKES",
    "STEERING_SUSPENSION",
    "ELECTRICAL_BATTERY",
    "TRANSMISSION_CLUTCH",
    "AC_HEATING",
    "STRANGE_NOISE",
    "LEAK",
    "OTHER",
  ]),
  vehicleStarts: requiredBoolean("Debes indicar si el vehiculo enciende"),
  canDrive: requiredBoolean("Debes indicar si se puede conducir normalmente"),
  warningLights: requiredBoolean("Debes indicar si hay testigos encendidos"),
  problemSince: z.enum(["TODAY", "DAYS", "WEEKS", "MONTHS"]),
  issueFrequency: z.enum(["CONSTANT", "INTERMITTENT"]),
  description: requiredText(8, 600),
});

export const createSelfInspectionInviteSchema = z.object({
  sourceChannel: z.nativeEnum(SelfInspectionSource).default(SelfInspectionSource.SECURE_LINK),
  expiresInDays: numberFromUnknown(1, 30).default(7),
});

export const reviewSelfInspectionSchema = z.object({
  riskAssessment: z.nativeEnum(SelfInspectionRiskLevel),
  internalSummary: requiredText(12, 2_000),
  operationalOutcome: z.nativeEnum(SelfInspectionOperationalOutcome),
  recommendedNextStep: z.nativeEnum(ReviewRecommendedNextStep),
  departmentSuggestion: z.preprocess(
    emptyToUndefined,
    z.nativeEnum(SelfInspectionDepartment).optional(),
  ),
  createWorkOrderSuggestion: z
    .preprocess((value) => value === "on" || value === true, z.boolean())
    .default(false),
  createQuoteSuggestion: z
    .preprocess((value) => value === "on" || value === true, z.boolean())
    .default(false),
  note: optionalText(500),
});

export const updateSelfInspectionStatusSchema = z.object({
  status: z.nativeEnum(SelfInspectionStatus),
  note: optionalText(255),
});

export const selfInspectionFiltersSchema = z.object({
  q: optionalText(120),
  status: z.preprocess(emptyToUndefined, z.nativeEnum(SelfInspectionStatus).optional()),
  risk: z.preprocess(emptyToUndefined, z.nativeEnum(SelfInspectionRiskLevel).optional()),
});

export const selfInspectionPhotoUploadSchema = z.object({
  photoType: z.nativeEnum(SelfInspectionPhotoType),
  comment: optionalText(240),
  sortOrder: numberFromUnknown(0, 100).default(0),
});

export const publicSelfInspectionAccessSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("login"),
    email: z.email().trim(),
    password: requiredText(8, 128),
  }),
  z
    .object({
      mode: z.literal("register"),
      fullName: requiredText(3, 120),
      email: z.email().trim(),
      password: requiredText(8, 128),
      confirmPassword: requiredText(8, 128),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: "Las contrasenas no coinciden",
      path: ["confirmPassword"],
    }),
]);

export const submitSelfInspectionSchema = z.object({
  finalComment: optionalText(1_000),
});

export type SelfInspectionVehicleStepInput = z.infer<typeof selfInspectionVehicleStepSchema>;
export type SelfInspectionReasonStepInput = z.infer<typeof selfInspectionReasonStepSchema>;
export type CreateSelfInspectionInviteInput = z.infer<typeof createSelfInspectionInviteSchema>;
export type ReviewSelfInspectionInput = z.infer<typeof reviewSelfInspectionSchema>;
export type UpdateSelfInspectionStatusInput = z.infer<typeof updateSelfInspectionStatusSchema>;
export type PublicSelfInspectionAccessInput = z.infer<typeof publicSelfInspectionAccessSchema>;
export type SubmitSelfInspectionInput = z.infer<typeof submitSelfInspectionSchema>;
