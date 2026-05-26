import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (value === null) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

export function requiredText(min = 1, max = 255) {
  return z.string().trim().min(min).max(max);
}

export function optionalText(max = 255) {
  return z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
}

export function optionalInteger() {
  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);

    if (normalized === undefined) {
      return undefined;
    }

    if (typeof normalized === "number") {
      return normalized;
    }

    if (typeof normalized === "string") {
      return Number(normalized);
    }

    return normalized;
  }, z.number().int().nonnegative().optional());
}

export function requiredInteger(min: number, max: number) {
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

export function optionalDateOnly() {
  return z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  );
}
