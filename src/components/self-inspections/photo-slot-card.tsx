"use client";

import type { ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-compression";

type PhotoSlotCardProps = {
  slot: {
    photoType: string;
    label: string;
    helpText: string;
    required: boolean;
  };
  photo?: {
    id: string;
    fileUrl: string;
    fileName: string;
    comment?: string | null;
  };
  uploading?: boolean;
  onUpload: (file: File, photoType: string) => void;
  onDelete: (photoId: string) => void;
};

export function PhotoSlotCard({
  slot,
  photo,
  uploading,
  onUpload,
  onDelete,
}: PhotoSlotCardProps) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      try {
        const compressedFile = await compressImage(file);
        onUpload(compressedFile, slot.photoType);
      } catch (error) {
        console.error("Image compression failed:", error);
        onUpload(file, slot.photoType);
      }
    }
  }

  return (
    <div
      className={cn(
        "space-y-4 rounded-[24px] border bg-white/75 p-4",
        slot.required ? "border-[rgba(200,92,42,0.22)]" : "border-[color:var(--border)]",
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[color:var(--foreground)]">{slot.label}</p>
          {slot.required ? (
            <span className="rounded-full bg-[rgba(200,92,42,0.12)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
              Obligatoria
            </span>
          ) : null}
        </div>
        <p className="text-xs leading-5 text-[color:var(--muted)]">{slot.helpText}</p>
      </div>

      {photo ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={slot.label}
            className="h-40 w-full rounded-[20px] object-cover"
            src={photo.fileUrl}
          />
          <p className="text-xs text-[color:var(--muted-strong)]">{photo.fileName}</p>
          <div className="flex flex-wrap gap-3">
            <label>
              <input accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} type="file" />
              <span className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-[color:var(--border-strong)] bg-white px-5 text-sm font-semibold text-[color:var(--foreground)]">
                Reemplazar
              </span>
            </label>
            <Button onClick={() => onDelete(photo.id)} type="button" variant="ghost">
              Quitar
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 text-center">
          <input accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} type="file" />
          <span className="text-sm font-semibold text-[color:var(--foreground)]">
            {uploading ? "Subiendo imagen..." : "Seleccionar foto"}
          </span>
          <span className="mt-2 text-xs text-[color:var(--muted)]">
            JPG, PNG, WEBP o HEIC hasta 8 MB
          </span>
        </label>
      )}
    </div>
  );
}
