"use client";

import { BudgetStatus } from "@prisma/client";
import { useActionState } from "react";

import { respondToInsuranceBudgetAction } from "@/app/liquidador/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";

export function LiquidatorBudgetResponseForm({
  budgetId,
  caseId,
  status,
}: {
  budgetId: string;
  caseId: string;
  status: BudgetStatus;
}) {
  const [state, formAction] = useActionState(
    respondToInsuranceBudgetAction.bind(null, budgetId, caseId),
    initialActionState,
  );

  if (status !== BudgetStatus.SENT) {
    return null;
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[color:var(--muted-strong)]"
          htmlFor="liquidatorBudgetResponseNote"
        >
          Comentario para el taller
        </label>
        <Textarea
          id="liquidatorBudgetResponseNote"
          name="note"
          placeholder="Ej. Aprobado, ajustar mano de obra, o dejar fuera un item especifico."
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button name="nextStatus" type="submit" value={BudgetStatus.APPROVED}>
          Aprobar presupuesto
        </Button>
        <Button
          name="nextStatus"
          type="submit"
          value={BudgetStatus.REJECTED}
          variant="secondary"
        >
          Rechazar presupuesto
        </Button>
        <Button
          name="nextStatus"
          type="submit"
          value={BudgetStatus.REQUEST_CHANGES}
          variant="secondary"
        >
          Pedir cambios
        </Button>
        <Button
          name="nextStatus"
          type="submit"
          value={BudgetStatus.PARTIALLY_APPROVED}
          variant="secondary"
        >
          Aprobar parcial
        </Button>
      </div>

      <FormMessage
        message={state.error ?? state.success}
        tone={state.success ? "success" : "error"}
      />
    </form>
  );
}
