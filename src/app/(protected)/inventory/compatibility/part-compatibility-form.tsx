"use client";

import { useActionState } from "react";

import { assignPartCompatibilityAction } from "@/app/(protected)/inventory/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";

type PartCompatibilityFormProps = {
  repuestos: Array<{
    id: string;
    label: string;
  }>;
  vehicles: Array<{
    id: string;
    label: string;
  }>;
};

export function PartCompatibilityForm({ repuestos, vehicles }: PartCompatibilityFormProps) {
  const [state, formAction] = useActionState(
    assignPartCompatibilityAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="repuestoId"
          >
            Repuesto
          </label>
          <Select id="repuestoId" name="repuestoId">
            <option value="">Selecciona un repuesto</option>
            {repuestos.map((repuesto) => (
              <option key={repuesto.id} value={repuesto.id}>
                {repuesto.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="vehicleId"
          >
            Vehiculo por VIN
          </label>
          <Select id="vehicleId" name="vehicleId">
            <option value="">Selecciona un vehiculo real</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="notes"
          >
            Nota de verificacion
          </label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Ej. Verificado contra catalogo del proveedor o historial del taller"
          />
        </div>
      </div>

      <FormMessage message={state.error} />
      <Button type="submit">Registrar compatibilidad</Button>
    </form>
  );
}
