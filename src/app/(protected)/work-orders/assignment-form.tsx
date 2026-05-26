"use client";

import { useActionState } from "react";

import { updateWorkOrderAssignmentAction } from "@/app/(protected)/work-orders/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";

type AssignmentFormProps = {
  orderId: string;
  currentAssignedTechnicianId?: string | null;
  mechanics: Array<{
    id: string;
    name: string;
  }>;
};

export function AssignmentForm({
  orderId,
  currentAssignedTechnicianId,
  mechanics,
}: AssignmentFormProps) {
  const [state, formAction] = useActionState(updateWorkOrderAssignmentAction, initialActionState);
  const currentMechanicName =
    mechanics.find((mechanic) => mechanic.id === currentAssignedTechnicianId)?.name ??
    "Sin asignar";

  return (
    <form action={formAction} className="space-y-4">
      <input name="orderId" type="hidden" value={orderId} />
      <div className="rounded-xl border border-[color:var(--border)] bg-white/70 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Responsable actual
        </p>
        <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
          {currentMechanicName}
        </p>
      </div>
      <Select defaultValue={currentAssignedTechnicianId ?? ""} name="assignedTechnicianId">
        <option value="">Sin asignar</option>
        {mechanics.map((mechanic) => (
          <option key={mechanic.id} value={mechanic.id}>
            {mechanic.name}
          </option>
        ))}
      </Select>
      <FormMessage message={state.error} />
      <SubmitButton label="Actualizar responsable" pendingLabel="Actualizando..." />
    </form>
  );
}
