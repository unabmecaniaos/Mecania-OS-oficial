"use client";

import { useActionState } from "react";
import { TimeOffRequestStatus } from "@prisma/client";

import {
  createTimeOffRequestAction,
  reviewTimeOffRequestAction,
} from "@/app/(protected)/time-off/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";
import { TIME_OFF_REQUEST_TYPE_OPTIONS } from "@/modules/time-off/time-off.constants";

export function TimeOffRequestForm() {
  const [state, formAction] = useActionState(createTimeOffRequestAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="type">
            Tipo
          </label>
          <Select id="type" name="type" required>
            {TIME_OFF_REQUEST_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="startDate"
          >
            Desde
          </label>
          <Input id="startDate" name="startDate" required type="date" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="endDate">
            Hasta
          </label>
          <Input id="endDate" name="endDate" required type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="reason">
          Motivo
        </label>
        <Textarea
          id="reason"
          name="reason"
          placeholder="Ej. Vacaciones coordinadas con anticipacion o permiso personal."
        />
      </div>

      <FormMessage message={state.error ?? state.success} tone={state.success ? "success" : "error"} />
      <SubmitButton label="Enviar solicitud" pendingLabel="Enviando..." />
    </form>
  );
}

export function TimeOffReviewForm({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState(reviewTimeOffRequestAction, initialActionState);

  return (
    <form action={formAction} className="space-y-3">
      <input name="requestId" type="hidden" value={requestId} />
      <Textarea
        name="reviewNote"
        placeholder="Nota opcional para el mecanico"
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        <SubmitButton
          label="Aprobar"
          name="status"
          pendingLabel="Revisando..."
          value={TimeOffRequestStatus.APPROVED}
          variant="secondary"
        />
        <SubmitButton
          label="Rechazar"
          name="status"
          pendingLabel="Revisando..."
          value={TimeOffRequestStatus.REJECTED}
          variant="secondary"
        />
      </div>
      <FormMessage message={state.error ?? state.success} tone={state.success ? "success" : "error"} />
    </form>
  );
}
