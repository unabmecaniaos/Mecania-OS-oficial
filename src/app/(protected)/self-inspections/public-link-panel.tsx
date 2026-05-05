"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type PublicLinkPanelProps = {
  publicUrl: string;
};

export function PublicLinkPanel({ publicUrl }: PublicLinkPanelProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className="rounded-[24px] border border-[rgba(200,92,42,0.18)] bg-[rgba(200,92,42,0.08)] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
        Enlace seguro recien generado
      </p>
      <p className="mt-2 break-all text-sm font-semibold text-[color:var(--foreground)]">
        {publicUrl}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <a href={publicUrl} rel="noreferrer" target="_blank">
          <Button variant="primary">Abrir enlace cliente</Button>
        </a>
        <Button onClick={handleCopy} type="button" variant="secondary">
          {copyState === "copied"
            ? "Enlace copiado"
            : copyState === "error"
              ? "No se pudo copiar"
              : "Copiar enlace"}
        </Button>
      </div>
    </div>
  );
}
