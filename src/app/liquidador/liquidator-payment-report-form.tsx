"use client";

import { BudgetStatus, PaymentStatus } from "@prisma/client";
import { useActionState } from "react";

import { reportLiquidatorBudgetPaymentAction } from "@/app/liquidador/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";

const REPORTABLE_STATUSES = new Set<BudgetStatus>([
  BudgetStatus.APPROVED,
  BudgetStatus.PARTIALLY_APPROVED,
  BudgetStatus.CONVERTED_TO_WORK_ORDER,
]);

type LiquidatorPaymentReportFormProps = {
  budgetId: string;
  caseId: string;
  budgetStatus: BudgetStatus;
  paymentStatus: PaymentStatus;
};

export function LiquidatorPaymentReportForm({
  budgetId,
  caseId,
  budgetStatus,
  paymentStatus,
}: LiquidatorPaymentReportFormProps) {
  const [state, formAction] = useActionState(
    reportLiquidatorBudgetPaymentAction.bind(null, budgetId, caseId),
    initialActionState,
  );

  if (!REPORTABLE_STATUSES.has(budgetStatus)) {
    return null;
  }

  if (paymentStatus === PaymentStatus.PAID) {
    return (
      <FormMessage
        message="El pago ya fue validado por el taller."
        tone="success"
      />
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="liquidatorPaymentReference">
          Referencia de pago
        </label>
        <Input
          defaultValue=""
          id="liquidatorPaymentReference"
          name="paymentReference"
          placeholder="Ej. Transferencia 9841"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="liquidatorPaymentProof">
          Comprobante de pago
        </label>
        <input
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="block w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--foreground)] file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--surface-strong)] file:px-3 file:py-2 file:text-sm file:font-medium"
          id="liquidatorPaymentProof"
          name="proof"
          type="file"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="liquidatorPaymentNote">
          Comentario opcional
        </label>
        <Textarea
          id="liquidatorPaymentNote"
          name="note"
          placeholder="Ej. Se adjunta comprobante de transferencia para validacion del taller."
        />
      </div>

      <SubmitButton label="Reportar pago" pendingLabel="Enviando comprobante..." />
      <FormMessage
        message={state.error ?? state.success}
        tone={state.success ? "success" : "error"}
      />
    </form>
  );
}

