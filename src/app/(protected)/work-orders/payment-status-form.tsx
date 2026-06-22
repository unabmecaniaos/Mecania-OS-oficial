"use client";

import { useActionState } from "react";
import { PaymentStatus } from "@prisma/client";

import { markWorkOrderPaidAction } from "@/app/(protected)/work-orders/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";

type PaymentStatusFormProps = {
  orderId: string;
  paymentStatus: PaymentStatus;
  paymentReference?: string | null;
};

export function PaymentStatusForm({
  orderId,
  paymentStatus,
  paymentReference,
}: PaymentStatusFormProps) {
  const [state, formAction] = useActionState(markWorkOrderPaidAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="orderId" type="hidden" value={orderId} />

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="paymentReference">
          Referencia de pago
        </label>
        <Input
          defaultValue={paymentReference ?? ""}
          id="paymentReference"
          name="paymentReference"
          placeholder="Transferencia, portal, comprobante, etc."
        />
      </div>

      <FormMessage message={state.error} />
      {paymentStatus === PaymentStatus.PAID ? (
        <FormMessage
          className="mt-2"
          message="La orden ya se encuentra marcada como pagada."
          tone="success"
        />
      ) : (
        <SubmitButton label="Marcar orden como pagada" pendingLabel="Actualizando pago..." />
      )}
    </form>
  );
}
