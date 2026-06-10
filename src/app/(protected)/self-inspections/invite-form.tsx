"use client";

import { useActionState } from "react";

import { createSelfInspectionInviteAction } from "@/app/(protected)/self-inspections/actions";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";

export function InviteForm() {
  const [state, formAction] = useActionState(createSelfInspectionInviteAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-3">
      <FormMessage
        className="max-w-sm"
        message={state.error}
      />
      <SubmitButton label="Generar enlace seguro" pendingLabel="Generando enlace..." />
    </form>
  );
}
