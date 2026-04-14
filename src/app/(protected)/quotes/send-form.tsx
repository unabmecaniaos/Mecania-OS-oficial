"use client";

import { useActionState } from "react";

import { sendQuoteAction } from "@/app/(protected)/quotes/actions";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";

export function SendQuoteForm({ quoteId }: { quoteId: string }) {
  const [state, formAction] = useActionState(sendQuoteAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="quoteId" type="hidden" value={quoteId} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="send-note">
          Nota de envio
        </label>
        <Textarea
          id="send-note"
          name="note"
          placeholder="Ej.: Presupuesto enviado por correo y listo para revision externa"
        />
      </div>

      <FormMessage message={state.error} />
      <SubmitButton label="Enviar presupuesto" pendingLabel="Enviando presupuesto..." />
    </form>
  );
}
