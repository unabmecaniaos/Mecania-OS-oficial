"use client";

import { useActionState } from "react";
import { WorkOrderStatus } from "@prisma/client";

import { createWorkOrderAction } from "@/app/(protected)/work-orders/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";
import { WORK_ORDER_STATUS_OPTIONS } from "@/modules/work-orders/work-order.constants";

type WorkOrderFormProps = {
  clients: Array<{
    id: string;
    fullName: string;
  }>;
  vehicles: Array<{
    id: string;
    label: string;
  }>;
  defaultClientId?: string;
  defaultVehicleId?: string;
};

export function WorkOrderForm({
  clients,
  vehicles,
  defaultClientId,
  defaultVehicleId,
}: WorkOrderFormProps) {
  const [state, formAction] = useActionState(createWorkOrderAction, initialActionState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-[20px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.48)] p-5">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Contexto base
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Relaciona cliente y vehiculo antes de abrir el flujo tecnico.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="clientId">
              Cliente
            </label>
            <Select defaultValue={defaultClientId} id="clientId" name="clientId">
              <option value="">Selecciona un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.fullName}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="vehicleId">
              Vehiculo
            </label>
            <Select defaultValue={defaultVehicleId} id="vehicleId" name="vehicleId">
              <option value="">Selecciona un vehiculo</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.48)] p-5">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Diagnostico inicial
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Resume el ingreso, primeras observaciones y condiciones de trabajo.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="reason">
              Motivo de ingreso
            </label>
            <Textarea id="reason" name="reason" placeholder="Describir el motivo principal del ingreso" />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="initialDiagnosis"
            >
              Diagnostico inicial
            </label>
            <Textarea
              id="initialDiagnosis"
              name="initialDiagnosis"
              placeholder="Observaciones del mecanico al recibir el vehiculo"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.48)] p-5">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Planificacion
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Define el estado de arranque y la expectativa de entrega.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="status">
              Estado inicial
            </label>
            <Select defaultValue={WorkOrderStatus.RECEIVED} id="status" name="status">
              {WORK_ORDER_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="estimatedDate"
            >
              Fecha estimada
            </label>
            <Input id="estimatedDate" name="estimatedDate" type="date" />
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.48)] p-5">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Observaciones internas
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Notas adicionales para coordinacion interna del taller.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="notes">
            Observaciones
          </label>
          <Textarea id="notes" name="notes" placeholder="Notas internas de la orden" />
        </div>
      </div>

      <FormMessage message={state.error} />
      <div className="flex justify-end border-t border-[color:var(--border)] pt-5">
        <SubmitButton label="Crear orden de trabajo" pendingLabel="Guardando orden..." />
      </div>
    </form>
  );
}
