"use client";

import { ChangeEvent, useActionState, useState } from "react";
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
    clientId: string;
    label: string;
  }>;
  mechanics: Array<{
    id: string;
    name: string;
  }>;
  contextSummary?: {
    eyebrow: string;
    title: string;
    details: string[];
  };
  defaultClientId?: string;
  defaultInitialDiagnosis?: string;
  defaultReason?: string;
  defaultVehicleId?: string;
  lockClientVehicle?: boolean;
};

export function WorkOrderForm({
  clients,
  vehicles,
  mechanics,
  contextSummary,
  defaultClientId,
  defaultInitialDiagnosis,
  defaultReason,
  defaultVehicleId,
  lockClientVehicle = false,
}: WorkOrderFormProps) {
  const [state, formAction] = useActionState(createWorkOrderAction, initialActionState);
  const initialClientId =
    defaultClientId ?? vehicles.find((vehicle) => vehicle.id === defaultVehicleId)?.clientId ?? "";
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [selectedVehicleId, setSelectedVehicleId] = useState(() => {
    if (!defaultVehicleId) {
      return "";
    }

    const defaultVehicle = vehicles.find((vehicle) => vehicle.id === defaultVehicleId);
    return defaultVehicle?.clientId === initialClientId ? defaultVehicleId : "";
  });
  const availableVehicles = selectedClientId
    ? vehicles.filter((vehicle) => vehicle.clientId === selectedClientId)
    : [];

  function handleClientChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextClientId = event.target.value;
    setSelectedClientId(nextClientId);

    const currentVehicleBelongsToNextClient = vehicles.some(
      (vehicle) => vehicle.id === selectedVehicleId && vehicle.clientId === nextClientId,
    );

    if (!nextClientId || !currentVehicleBelongsToNextClient) {
      setSelectedVehicleId("");
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      {contextSummary ? (
        <div className="rounded-2xl border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.06)] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[#1d4ed8]">
            {contextSummary.eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">
            {contextSummary.title}
          </h2>
          <div className="mt-3 space-y-1 text-sm text-[color:var(--muted-strong)]">
            {contextSummary.details.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
          </div>
        </div>
      ) : null}

      {lockClientVehicle ? (
        <>
          <input name="clientId" type="hidden" value={selectedClientId} />
          <input name="vehicleId" type="hidden" value={selectedVehicleId} />
        </>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="clientId">
            Cliente
          </label>
          <Select
            disabled={lockClientVehicle}
            id="clientId"
            name={lockClientVehicle ? undefined : "clientId"}
            onChange={handleClientChange}
            value={selectedClientId}
          >
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
          <Select
            disabled={!selectedClientId || lockClientVehicle}
            id="vehicleId"
            name={lockClientVehicle ? undefined : "vehicleId"}
            onChange={(event) => setSelectedVehicleId(event.target.value)}
            value={selectedVehicleId}
          >
            <option value="">
              {selectedClientId ? "Selecciona un vehiculo" : "Selecciona primero un cliente"}
            </option>
            {availableVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="reason">
            Motivo de ingreso
          </label>
          <Textarea
            defaultValue={defaultReason}
            id="reason"
            name="reason"
            placeholder="Describir el motivo principal del ingreso"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="initialDiagnosis"
          >
            Diagnostico inicial
          </label>
          <Textarea
            defaultValue={defaultInitialDiagnosis}
            id="initialDiagnosis"
            name="initialDiagnosis"
            placeholder="Observaciones del mecanico al recibir el vehiculo"
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="assignedTechnicianId"
          >
            Tecnico asignado
          </label>
          <Select id="assignedTechnicianId" name="assignedTechnicianId">
            <option value="">Sin asignar</option>
            {mechanics.map((mechanic) => (
              <option key={mechanic.id} value={mechanic.id}>
                {mechanic.name}
              </option>
            ))}
          </Select>
        </div>

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
            Fecha prometida
          </label>
          <Input id="estimatedDate" name="estimatedDate" type="date" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="notes">
            Observaciones
          </label>
          <Textarea id="notes" name="notes" placeholder="Notas internas de la orden" />
        </div>
      </div>

      <FormMessage message={state.error} />
      <SubmitButton
        className="w-full sm:w-auto"
        label="Crear orden de trabajo"
        pendingLabel="Guardando orden..."
      />
    </form>
  );
}
