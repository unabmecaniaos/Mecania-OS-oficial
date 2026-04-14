"use client";

import { useActionState } from "react";

import { approveQuoteAction } from "@/app/(protected)/quotes/actions";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";

export function ApproveQuoteForm({ quoteId }: { quoteId: string }) {
  const [state, formAction] = useActionState(approveQuoteAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="quoteId" type="hidden" value={quoteId} />
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[color:var(--muted-strong)]"
          htmlFor="approve-note"
        >
          Nota de aprobacion
        </label>
        <Textarea
          id="approve-note"
          name="note"
          placeholder="Ej.: Cliente confirma por telefono y autoriza iniciar trabajos"
        />
      </div>

      <FormMessage message={state.error} />
      <SubmitButton label="Registrar aprobacion" pendingLabel="Registrando aprobacion..." />
    </form>
  );
}
