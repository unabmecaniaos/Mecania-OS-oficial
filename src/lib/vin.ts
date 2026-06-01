import { z } from "zod";

export const VIN_LENGTH = 17;
export const VIN_ALLOWED_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

const VIN_INVALID_LETTERS = /[IOQ]/i;

const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
};

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizeVin(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function isValidVinFormat(value: string) {
  return VIN_ALLOWED_PATTERN.test(normalizeVin(value));
}

export function getVinFormatError(value: string) {
  const normalized = normalizeVin(value);

  if (normalized.length !== VIN_LENGTH) {
    return "El VIN debe tener exactamente 17 caracteres";
  }

  if (VIN_INVALID_LETTERS.test(normalized)) {
    return "El VIN no puede contener las letras I, O ni Q";
  }

  if (!VIN_ALLOWED_PATTERN.test(normalized)) {
    return "El VIN solo puede incluir letras y numeros validos";
  }

  return null;
}

export function calculateNorthAmericanVinCheckDigit(value: string) {
  const normalized = normalizeVin(value);

  if (!VIN_ALLOWED_PATTERN.test(normalized)) {
    return null;
  }

  const sum = normalized.split("").reduce((total, character, index) => {
    const numericValue = /\d/.test(character)
      ? Number(character)
      : VIN_TRANSLITERATION[character];

    return total + numericValue * VIN_WEIGHTS[index];
  }, 0);
  const remainder = sum % 11;

  return remainder === 10 ? "X" : String(remainder);
}

export function hasValidNorthAmericanVinCheckDigit(value: string) {
  const normalized = normalizeVin(value);
  const checkDigit = calculateNorthAmericanVinCheckDigit(normalized);

  return checkDigit !== null && normalized[8] === checkDigit;
}

export const vinSchema = z
  .string()
  .trim()
  .transform(normalizeVin)
  .refine((value) => getVinFormatError(value) === null, {
    message: "El VIN debe tener 17 caracteres validos y no puede incluir I, O ni Q",
  });

export const optionalVinSchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    return value;
  },
  vinSchema.optional(),
);
