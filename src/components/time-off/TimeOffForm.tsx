"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";
import { createTimeOffRequestAction } from "@/app/(protected)/time-off/actions";

export function TimeOffForm() {
  const [state, formAction] = useActionState(createTimeOffRequestAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4 rounded-[24px] border border-[rgba(23,52,94,0.12)] bg-white p-6 shadow-sm">
      <h3 className="font-heading text-xl font-semibold text-[color:var(--foreground)]">Solicitar Días Libres</h3>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="startDate">
            Fecha de inicio
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            className="min-h-12 rounded-2xl"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="endDate">
            Fecha de fin
          </label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            className="min-h-12 rounded-2xl"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="reason">
          Motivo o comentarios
        </label>
        <Textarea
          id="reason"
          name="reason"
          placeholder="Ej: Vacaciones anuales, trámite personal..."
          className="min-h-24 rounded-2xl resize-none"
          required
        />
      </div>

      <FormMessage message={state.error} />

      <SubmitButton
        className="min-h-12 w-full rounded-2xl"
        label="Enviar Solicitud"
        pendingLabel="Enviando..."
      />
    </form>
  );
}
