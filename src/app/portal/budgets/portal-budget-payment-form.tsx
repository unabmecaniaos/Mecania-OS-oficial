"use client";

import { useActionState } from "react";

import { confirmCustomerPortalMockPaymentAction } from "@/app/portal/budgets/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";

export function PortalBudgetPaymentForm({ budgetId }: { budgetId: string }) {
  const [state, formAction] = useActionState(
    confirmCustomerPortalMockPaymentAction.bind(null, budgetId),
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="portalPaymentReference">
          Referencia de pago
        </label>
        <Input
          id="portalPaymentReference"
          name="paymentReference"
          placeholder="Ej. Transferencia 2481 o portal web"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="portalPaymentNote">
          Comentario opcional
        </label>
        <Textarea
          id="portalPaymentNote"
          name="note"
          placeholder="Ej. Pago simulado para validar el flujo del portal cliente."
        />
      </div>

      <SubmitButton label="Pagar ahora" pendingLabel="Procesando pago..." />
      <FormMessage
        message={state.error ?? state.success}
        tone={state.success ? "success" : "error"}
      />
    </form>
  );
}
