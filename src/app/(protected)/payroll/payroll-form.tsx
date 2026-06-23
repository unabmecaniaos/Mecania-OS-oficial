"use client";

import { useActionState } from "react";

import { createMechanicPaymentAction } from "@/app/(protected)/payroll/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";
import { MECHANIC_PAYMENT_CONCEPT_OPTIONS } from "@/modules/payroll/payroll.constants";

type PayrollFormProps = {
  mechanics: Array<{
    id: string;
    name: string;
  }>;
};

export function PayrollForm({ mechanics }: PayrollFormProps) {
  const [state, formAction] = useActionState(createMechanicPaymentAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="mechanicId">
            Mecanico
          </label>
          <Select id="mechanicId" name="mechanicId" required>
            <option value="">Selecciona un mecanico activo</option>
            {mechanics.map((mechanic) => (
              <option key={mechanic.id} value={mechanic.id}>
                {mechanic.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="concept">
            Concepto
          </label>
          <Select id="concept" name="concept" required>
            {MECHANIC_PAYMENT_CONCEPT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="amount">
            Monto
          </label>
          <Input id="amount" min={1} name="amount" placeholder="Ej. 250000" required type="number" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="paidAt">
            Fecha de pago
          </label>
          <Input id="paidAt" name="paidAt" required type="date" />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="note">
            Nota
          </label>
          <Textarea id="note" name="note" placeholder="Detalle interno opcional del pago." />
        </div>
      </div>

      <FormMessage message={state.error ?? state.success} tone={state.success ? "success" : "error"} />
      <SubmitButton label="Registrar pago" pendingLabel="Registrando..." />
    </form>
  );
}
