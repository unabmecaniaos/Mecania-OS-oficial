"use client";

import { useActionState, useMemo, useState } from "react";

import { createRepuestoAction } from "@/app/(protected)/inventory/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";

type RepuestoFormProps = {
  vehicles?: Array<{
    id: string;
    label: string;
  }>;
};

export function RepuestoForm({ vehicles = [] }: RepuestoFormProps) {
  const [state, formAction] = useActionState(createRepuestoAction, initialActionState);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<(typeof vehicles)[number] | null>(null);
  const vehicleMatches = useMemo(
    () => filterOptions(vehicles, vehicleQuery, selectedVehicle?.id),
    [selectedVehicle?.id, vehicleQuery, vehicles],
  );

  return (
    <form action={formAction} className="space-y-5">
      <input name="compatibleVehicleId" type="hidden" value={selectedVehicle?.id ?? ""} />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="name">
            Nombre
          </label>
          <Input id="name" name="name" placeholder="Pastillas de freno delanteras" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="code">
            Codigo o referencia
          </label>
          <Input id="code" name="code" placeholder="PF-DEL-001" />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="unitPrice"
          >
            Precio referencial
          </label>
          <Input defaultValue={0} id="unitPrice" min={0} name="unitPrice" type="number" />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="initialStock"
          >
            Stock inicial
          </label>
          <Input defaultValue={0} id="initialStock" min={0} name="initialStock" type="number" />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="minimumStock"
          >
            Stock minimo
          </label>
          <Input defaultValue={0} id="minimumStock" min={0} name="minimumStock" type="number" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="compatibleVehicleSearch"
          >
            Vehiculo compatible inicial
          </label>
          <Input
            autoComplete="off"
            id="compatibleVehicleSearch"
            onChange={(event) => {
              setVehicleQuery(event.target.value);
              setSelectedVehicle(null);
            }}
            onFocus={() => {
              if (selectedVehicle) {
                setVehicleQuery(selectedVehicle.label);
                setSelectedVehicle(null);
              }
            }}
            placeholder="Busca por VIN, patente, modelo o cliente"
            value={selectedVehicle?.label ?? vehicleQuery}
          />
          <SearchResults
            emptyLabel="No hay vehiculos que coincidan."
            onSelect={(vehicle) => {
              setSelectedVehicle(vehicle);
              setVehicleQuery("");
            }}
            options={vehicleMatches}
            selectedId={selectedVehicle?.id}
          />
          <p className="text-sm text-[color:var(--muted)]">
            Usa un VIN real de vehiculo ya registrado para que el presupuesto pueda filtrar este
            repuesto.
          </p>
        </div>
      </div>

      <FormMessage message={state.error} />
      <SubmitButton label="Crear repuesto" pendingLabel="Creando repuesto..." />
    </form>
  );
}

type SearchOption = {
  id: string;
  label: string;
};

function filterOptions<TOption extends SearchOption>(
  options: TOption[],
  query: string,
  selectedId?: string,
) {
  if (selectedId) {
    return [];
  }

  const normalizedQuery = normalizeSearch(query);

  if (!normalizedQuery) {
    return options.slice(0, 6);
  }

  const terms = normalizedQuery.split(" ").filter(Boolean);

  return options
    .filter((option) => {
      const normalizedLabel = normalizeSearch(option.label);
      return terms.every((term) => normalizedLabel.includes(term));
    })
    .slice(0, 8);
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function SearchResults<TOption extends SearchOption>({
  emptyLabel,
  onSelect,
  options,
  selectedId,
}: {
  emptyLabel: string;
  onSelect: (option: TOption) => void;
  options: TOption[];
  selectedId?: string;
}) {
  if (selectedId) {
    return (
      <p className="text-sm text-[#166534]">
        Seleccionado. Edita el campo para buscar otro vehiculo.
      </p>
    );
  }

  if (options.length === 0) {
    return <p className="text-sm text-[color:var(--muted)]">{emptyLabel}</p>;
  }

  return (
    <div className="max-h-60 overflow-y-auto rounded-xl border border-[color:var(--border)] bg-white p-1 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      {options.map((option) => (
        <button
          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[color:var(--foreground)] transition hover:bg-[rgba(37,99,235,0.08)]"
          key={option.id}
          onClick={() => onSelect(option)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
