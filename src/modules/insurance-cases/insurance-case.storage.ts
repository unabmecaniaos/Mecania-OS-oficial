import path from "node:path";
import { randomUUID } from "node:crypto";

import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import {
  deleteStorageObject,
  isLocalFileStorageFallbackEnabled,
  isPublicStorageEnabled,
  uploadPublicStorageObject,
} from "@/lib/supabase-storage";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const mimeExtensionMap: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

export function isInsuranceCaseStorageConfigured() {
  return isPublicStorageEnabled(env.SUPABASE_STORAGE_BUCKET_SELF_INSPECTIONS);
}

export function isInsuranceCaseUsingLocalStorageFallback() {
  return Boolean(
    env.SUPABASE_STORAGE_BUCKET_SELF_INSPECTIONS && isLocalFileStorageFallbackEnabled(),
  );
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function resolveFileExtension(fileName: string, mimeType: string) {
  const explicitExtension = path.extname(fileName);

  if (explicitExtension) {
    return explicitExtension.toLowerCase();
  }

  return mimeExtensionMap[mimeType] ?? ".jpg";
}

export function validateInsuranceCasePhotoFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new AppError("Formato de imagen no permitido. Usa JPG, PNG, WEBP o HEIC.", 422);
  }

  if (file.size <= 0) {
    throw new AppError("El archivo enviado esta vacio.", 422);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError("La imagen supera el tamano maximo de 8 MB.", 422);
  }
}

export async function saveInsuranceCasePhotoFile(input: {
  insuranceCaseId: string;
  file: File;
}) {
  validateInsuranceCasePhotoFile(input.file);

  if (!isInsuranceCaseStorageConfigured()) {
    throw new AppError(
      "La carga de fotos del siniestro no esta habilitada todavia en este entorno.",
      500,
    );
  }

  const bucket = env.SUPABASE_STORAGE_BUCKET_SELF_INSPECTIONS as string;
  const extension = resolveFileExtension(input.file.name, input.file.type);
  const safeOriginalName = sanitizeFileName(
    path.basename(input.file.name, path.extname(input.file.name)) || "insurance-case",
  );
  const finalFileName = `insurance-case-${safeOriginalName}-${randomUUID()}${extension}`;
  const storageKey = path.posix.join("insurance-cases", input.insuranceCaseId, finalFileName);

  return uploadPublicStorageObject({
    bucket,
    storageKey,
    file: input.file,
  });
}

export async function deleteInsuranceCasePhotoFile(storageKey: string) {
  if (!env.SUPABASE_STORAGE_BUCKET_SELF_INSPECTIONS) {
    return;
  }

  await deleteStorageObject(env.SUPABASE_STORAGE_BUCKET_SELF_INSPECTIONS, storageKey);
}
