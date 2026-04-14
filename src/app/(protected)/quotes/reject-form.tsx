"use client";

import { useActionState } from "react";

import { rejectQuoteAction } from "@/app/(protected)/quotes/actions";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";

export function RejectQuoteForm({ quoteId }: { quoteId: string }) {
  const [state, formAction] = useActionState(rejectQuoteAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="quoteId" type="hidden" value={quoteId} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="reject-note">
          Nota de rechazo
        </label>
        <Textarea
          id="reject-note"
          name="note"
          placeholder="Ej.: Aseguradora rechaza por deducible o cobertura no aplicable"
        />
      </div>

      <FormMessage message={state.error} />
      <SubmitButton
        className="w-full"
        label="Registrar rechazo"
        pendingLabel="Registrando rechazo..."
        variant="secondary"
      />
    </form>
  );
}
