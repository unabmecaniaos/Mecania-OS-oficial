"use client";

import { useActionState, useState } from "react";
import {
  WorkOrderAreaStatus,
  WorkOrderServiceFlow,
} from "@prisma/client";

import { updateWorkOrderFlowAction } from "@/app/(protected)/work-orders/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";
import {
  flowIncludesMechanics,
  flowIncludesPaint,
  WORK_ORDER_AREA_STATUS_OPTIONS,
  WORK_ORDER_SERVICE_FLOW_OPTIONS,
} from "@/modules/work-orders/work-order.constants";

type WorkOrderFlowFormProps = {
  orderId: string;
  currentServiceFlow: WorkOrderServiceFlow;
  currentMechanicsStatus: WorkOrderAreaStatus;
  currentPaintStatus: WorkOrderAreaStatus;
  currentAssignedTechnicianId?: string | null;
  currentAssignedPainterId?: string | null;
  mechanics: Array<{
    id: string;
    name: string;
  }>;
};

export function WorkOrderFlowForm({
  orderId,
  currentServiceFlow,
  currentMechanicsStatus,
  currentPaintStatus,
  currentAssignedTechnicianId,
  currentAssignedPainterId,
  mechanics,
}: WorkOrderFlowFormProps) {
  const [state, formAction] = useActionState(updateWorkOrderFlowAction, initialActionState);
  const [serviceFlow, setServiceFlow] = useState(currentServiceFlow);
  const hasMechanics = flowIncludesMechanics(serviceFlow);
  const hasPaint = flowIncludesPaint(serviceFlow);

  return (
    <form action={formAction} className="space-y-5">
      <input name="orderId" type="hidden" value={orderId} />

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="serviceFlow">
          Flujo de trabajo
        </label>
        <Select
          id="serviceFlow"
          name="serviceFlow"
          onChange={(event) => setServiceFlow(event.target.value as WorkOrderServiceFlow)}
          value={serviceFlow}
        >
          {WORK_ORDER_SERVICE_FLOW_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.05)] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#1d4ed8]">Mecanica</p>
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--muted-strong)]"
                htmlFor="assignedTechnicianId"
              >
                Responsable mecanica
              </label>
              <Select
                defaultValue={currentAssignedTechnicianId ?? ""}
                disabled={!hasMechanics}
                id="assignedTechnicianId"
                name="assignedTechnicianId"
              >
                <option value="">Sin asignar</option>
                {mechanics.map((mechanic) => (
                  <option key={mechanic.id} value={mechanic.id}>
                    {mechanic.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--muted-strong)]"
                htmlFor="mechanicsStatus"
              >
                Estado mecanica
              </label>
              <Select
                defaultValue={currentMechanicsStatus}
                disabled={!hasMechanics}
                id="mechanicsStatus"
                name="mechanicsStatus"
              >
                {WORK_ORDER_AREA_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(200,92,42,0.16)] bg-[rgba(200,92,42,0.06)] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
            Pintura
          </p>
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--muted-strong)]"
                htmlFor="assignedPainterId"
              >
                Responsable pintura
              </label>
              <Select
                defaultValue={currentAssignedPainterId ?? ""}
                disabled={!hasPaint}
                id="assignedPainterId"
                name="assignedPainterId"
              >
                <option value="">Sin asignar</option>
                {mechanics.map((mechanic) => (
                  <option key={mechanic.id} value={mechanic.id}>
                    {mechanic.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[color:var(--muted-strong)]"
                htmlFor="paintStatus"
              >
                Estado pintura
              </label>
              <Select
                defaultValue={currentPaintStatus}
                disabled={!hasPaint}
                id="paintStatus"
                name="paintStatus"
              >
                {WORK_ORDER_AREA_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {!hasMechanics ? (
        <input name="mechanicsStatus" type="hidden" value={WorkOrderAreaStatus.NOT_REQUIRED} />
      ) : null}
      {!hasPaint ? <input name="paintStatus" type="hidden" value={WorkOrderAreaStatus.NOT_REQUIRED} /> : null}

      <FormMessage message={state.error} />
      <SubmitButton label="Actualizar flujo operativo" pendingLabel="Actualizando..." />
    </form>
  );
}
