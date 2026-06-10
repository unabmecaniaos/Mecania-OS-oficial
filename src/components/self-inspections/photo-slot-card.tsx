"use client";

import type { ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      onUpload(file, slot.photoType);
    }
  }

  return (
    <div
      className={cn(
        "space-y-4 rounded-[var(--radius-panel)] border bg-[color:var(--surface-elevated)]/80 p-4 shadow-[var(--shadow-control)]",
        slot.required ? "border-[rgba(161,92,7,0.22)]" : "border-[color:var(--border)]",
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[color:var(--foreground)]">{slot.label}</p>
          {slot.required ? (
            <span className="rounded-full border border-[rgba(161,92,7,0.2)] bg-[color:var(--warning-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--warning)]">
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
            className="h-40 w-full rounded-[var(--radius-control)] object-cover"
            src={photo.fileUrl}
          />
          <p className="text-xs text-[color:var(--muted-strong)]">{photo.fileName}</p>
          <div className="flex flex-wrap gap-3">
            <label>
              <input accept="image/*" className="hidden" onChange={handleFileChange} type="file" />
              <span className="inline-flex min-h-11 cursor-pointer items-center rounded-[var(--radius-control)] border border-[color:var(--border-strong)] bg-white px-5 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-control)] hover:border-[color:var(--accent)]">
                Reemplazar
              </span>
            </label>
            <Button onClick={() => onDelete(photo.id)} type="button" variant="ghost">
              Quitar
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-control)] border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 text-center hover:border-[color:var(--accent)] hover:bg-[color:var(--info-soft)]">
          <input accept="image/*" className="hidden" onChange={handleFileChange} type="file" />
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
