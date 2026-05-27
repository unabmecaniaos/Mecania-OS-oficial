import path from "node:path";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";

import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

const PLACEHOLDER_SUPABASE_HOSTS = new Set(["example.supabase.co"]);
const PLACEHOLDER_SERVICE_ROLE_KEYS = new Set([
  "local-dev-service-role-key",
  "your-service-role-key",
]);

function requireStorageEnv() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.", 500);
  }
}

export function isSupabaseStorageEnvironmentConfigured() {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey || PLACEHOLDER_SERVICE_ROLE_KEYS.has(serviceRoleKey)) {
    return false;
  }

  try {
    const host = new URL(env.SUPABASE_URL).host.toLowerCase();
    return !PLACEHOLDER_SUPABASE_HOSTS.has(host);
  } catch {
    return false;
  }
}

export function isLocalFileStorageFallbackEnabled() {
  return env.NODE_ENV !== "production" && !isSupabaseStorageEnvironmentConfigured();
}

export function isPublicStorageEnabled(bucket?: string | null) {
  return Boolean(bucket && (isSupabaseStorageEnvironmentConfigured() || isLocalFileStorageFallbackEnabled()));
}

function encodeStoragePath(storageKey: string) {
  return storageKey
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function storageRequest(path: string, init?: RequestInit) {
  requireStorageEnv();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY as string;

  const response = await fetch(`${env.SUPABASE_URL}/storage/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new AppError(`No fue posible operar con Storage: ${detail}`, response.status);
  }

  return response;
}

export function buildPublicStorageUrl(bucket: string, storageKey: string) {
  if (isLocalFileStorageFallbackEnabled()) {
    return `/uploads/${bucket}/${encodeStoragePath(storageKey)}`;
  }

  return `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeStoragePath(storageKey)}`;
}

function resolveLocalStoragePath(bucket: string, storageKey: string) {
  const root = path.join(process.cwd(), "public", "uploads");
  const target = path.join(root, bucket, ...storageKey.split("/").filter(Boolean));
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(target);

  if (
    normalizedTarget !== normalizedRoot &&
    !normalizedTarget.startsWith(`${normalizedRoot}${path.sep}`)
  ) {
    throw new AppError("Ruta de almacenamiento local invalida.", 500);
  }

  return normalizedTarget;
}

export async function uploadPublicStorageObject(input: {
  bucket: string;
  storageKey: string;
  file: File;
  upsert?: boolean;
}) {
  const buffer = Buffer.from(await input.file.arrayBuffer());

  if (isLocalFileStorageFallbackEnabled()) {
    const destination = resolveLocalStoragePath(input.bucket, input.storageKey);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, buffer);

    return {
      storageKey: input.storageKey,
      fileUrl: buildPublicStorageUrl(input.bucket, input.storageKey),
      fileName: input.file.name,
      mimeType: input.file.type,
      sizeBytes: input.file.size,
    };
  }

  await storageRequest(`/object/${input.bucket}/${encodeStoragePath(input.storageKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": input.file.type,
      "x-upsert": input.upsert ? "true" : "false",
    },
    body: buffer,
  });

  return {
    storageKey: input.storageKey,
    fileUrl: buildPublicStorageUrl(input.bucket, input.storageKey),
    fileName: input.file.name,
    mimeType: input.file.type,
    sizeBytes: input.file.size,
  };
}

export async function readStorageObject(bucket: string, storageKey: string) {
  if (isLocalFileStorageFallbackEnabled()) {
    return readFile(resolveLocalStoragePath(bucket, storageKey));
  }

  const response = await storageRequest(`/object/${bucket}/${encodeStoragePath(storageKey)}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function deleteStorageObject(bucket: string, storageKey: string) {
  if (isLocalFileStorageFallbackEnabled()) {
    const destination = resolveLocalStoragePath(bucket, storageKey);
    await unlink(destination).catch(() => undefined);
    return;
  }

  await storageRequest(`/object/${bucket}/${encodeStoragePath(storageKey)}`, {
    method: "DELETE",
  }).catch(() => undefined);
}
