"use client";

import { useActionState } from "react";

import { updateWorkOrderPromisedDateAction } from "@/app/(protected)/work-orders/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";

type PromisedDateFormProps = {
  orderId: string;
  currentPromisedDate?: string;
};

export function PromisedDateForm({
  orderId,
  currentPromisedDate,
}: PromisedDateFormProps) {
  const [state, formAction] = useActionState(
    updateWorkOrderPromisedDateAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input name="orderId" type="hidden" value={orderId} />

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[color:var(--muted-strong)]"
          htmlFor="estimatedDate"
        >
          Fecha prometida
        </label>
        <Input
          defaultValue={currentPromisedDate ?? ""}
          id="estimatedDate"
          name="estimatedDate"
          type="date"
        />
      </div>

      <FormMessage message={state.error} />
      <SubmitButton label="Guardar fecha prometida" pendingLabel="Guardando..." />
    </form>
  );
}
