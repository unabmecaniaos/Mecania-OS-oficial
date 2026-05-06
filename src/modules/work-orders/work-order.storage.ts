import path from "node:path";
import { randomUUID } from "node:crypto";

import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import {
  deleteStorageObject,
  isPublicStorageEnabled,
  uploadPublicStorageObject,
} from "@/lib/supabase-storage";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const mimeExtensionMap: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function isWorkOrderEvidenceStorageConfigured() {
  return isPublicStorageEnabled(env.SUPABASE_STORAGE_BUCKET_WORK_ORDERS);
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

export function validateWorkOrderEvidenceFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new AppError("Formato no permitido. Usa JPG, PNG o WEBP.", 422);
  }

  if (file.size <= 0) {
    throw new AppError("El archivo enviado esta vacio.", 422);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError("La imagen supera el tamano maximo de 8 MB.", 422);
  }
}

export async function saveWorkOrderEvidenceFile(input: {
  workOrderId: string;
  file: File;
}) {
  validateWorkOrderEvidenceFile(input.file);

  if (!isWorkOrderEvidenceStorageConfigured()) {
    throw new AppError(
      "La carga de evidencias no esta habilitada todavia en este entorno.",
      500,
    );
  }

  const bucket = env.SUPABASE_STORAGE_BUCKET_WORK_ORDERS as string;
  const extension = resolveFileExtension(input.file.name, input.file.type);
  const safeOriginalName = sanitizeFileName(
    path.basename(input.file.name, path.extname(input.file.name)) || "evidence",
  );
  const finalFileName = `evidence-${safeOriginalName}-${randomUUID()}${extension}`;
  const storageKey = path.posix.join(input.workOrderId, finalFileName);

  return uploadPublicStorageObject({
    bucket,
    storageKey,
    file: input.file,
  });
}

export async function deleteWorkOrderEvidenceFile(storageKey: string) {
  if (!env.SUPABASE_STORAGE_BUCKET_WORK_ORDERS) {
    return;
  }

  await deleteStorageObject(env.SUPABASE_STORAGE_BUCKET_WORK_ORDERS, storageKey);
}
