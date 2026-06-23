"use client";

import { useActionState } from "react";

import { approvePaymentReportAction } from "@/app/(protected)/work-orders/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";

type PaymentReportApprovalFormProps = {
  orderId: string;
  reportId: string;
  paymentReference?: string | null;
};

export function PaymentReportApprovalForm({
  orderId,
  reportId,
  paymentReference,
}: PaymentReportApprovalFormProps) {
  const [state, formAction] = useActionState(approvePaymentReportAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="orderId" type="hidden" value={orderId} />
      <input name="reportId" type="hidden" value={reportId} />

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor={`paymentReportReference-${reportId}`}>
          Referencia confirmada
        </label>
        <Input
          defaultValue={paymentReference ?? ""}
          id={`paymentReportReference-${reportId}`}
          name="paymentReference"
          placeholder="Ej. Transferencia validada, voucher o folio"
        />
      </div>

      <SubmitButton label="Validar comprobante" pendingLabel="Validando pago..." />
      <FormMessage
        message={state.error ?? state.success}
        tone={state.success ? "success" : "error"}
      />
    </form>
  );
}
