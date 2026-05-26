"use client";

import { useActionState } from "react";

import { reviewSelfInspectionAction } from "@/app/(protected)/self-inspections/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";
import {
  SELF_INSPECTION_DEPARTMENT_OPTIONS,
  SELF_INSPECTION_NEXT_STEP_OPTIONS,
  SELF_INSPECTION_OPERATIONAL_OUTCOME_OPTIONS,
  SELF_INSPECTION_RISK_OPTIONS,
} from "@/modules/self-inspections/self-inspection.constants";

export function ReviewForm({ inspectionId }: { inspectionId: string }) {
  const [state, formAction] = useActionState(
    reviewSelfInspectionAction.bind(null, inspectionId),
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="riskAssessment">
            Riesgo final
          </label>
          <Select id="riskAssessment" name="riskAssessment">
            <option value="">Selecciona un nivel</option>
            {SELF_INSPECTION_RISK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="operationalOutcome">
            Resultado operativo
          </label>
          <Select id="operationalOutcome" name="operationalOutcome">
            <option value="">Selecciona un resultado</option>
            {SELF_INSPECTION_OPERATIONAL_OUTCOME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="recommendedNextStep">
            Proximo paso sugerido
          </label>
          <Select id="recommendedNextStep" name="recommendedNextStep">
            <option value="">Selecciona un paso</option>
            {SELF_INSPECTION_NEXT_STEP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="departmentSuggestion">
          Area sugerida
        </label>
        <Select id="departmentSuggestion" name="departmentSuggestion">
          <option value="">Sin derivacion especifica</option>
          {SELF_INSPECTION_DEPARTMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="internalSummary">
          Resumen interno
        </label>
        <Textarea id="internalSummary" name="internalSummary" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="note">
          Nota adicional
        </label>
        <Input id="note" name="note" placeholder="Opcional" />
      </div>

      <label className="flex items-center gap-3 text-sm text-[color:var(--muted-strong)]">
        <input className="size-4 rounded border-[color:var(--border-strong)]" name="createWorkOrderSuggestion" type="checkbox" />
        Sugerir creacion de orden de trabajo
      </label>

      <label className="flex items-center gap-3 text-sm text-[color:var(--muted-strong)]">
        <input className="size-4 rounded border-[color:var(--border-strong)]" name="createQuoteSuggestion" type="checkbox" />
        Sugerir cotizacion
      </label>

      <FormMessage message={state.error} />
      <SubmitButton label="Registrar revision" pendingLabel="Guardando revision..." />
    </form>
  );
}
