"use client";

import { useActionState, useMemo, useState } from "react";

import { assignPartCompatibilityAction } from "@/app/(protected)/inventory/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
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
  const [partQuery, setPartQuery] = useState("");
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [selectedPart, setSelectedPart] = useState<(typeof repuestos)[number] | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<(typeof vehicles)[number] | null>(null);

  const partMatches = useMemo(
    () => filterOptions(repuestos, partQuery, selectedPart?.id),
    [partQuery, repuestos, selectedPart?.id],
  );
  const vehicleMatches = useMemo(
    () => filterOptions(vehicles, vehicleQuery, selectedVehicle?.id),
    [vehicleQuery, selectedVehicle?.id, vehicles],
  );

  return (
    <form action={formAction} className="space-y-5">
      <input name="repuestoId" type="hidden" value={selectedPart?.id ?? ""} />
      <input name="vehicleId" type="hidden" value={selectedVehicle?.id ?? ""} />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="repuestoSearch"
          >
            Repuesto
          </label>
          <Input
            autoComplete="off"
            id="repuestoSearch"
            onChange={(event) => {
              setPartQuery(event.target.value);
              setSelectedPart(null);
            }}
            onFocus={() => {
              if (selectedPart) {
                setPartQuery(selectedPart.label);
                setSelectedPart(null);
              }
            }}
            placeholder="Busca por nombre o codigo"
            value={selectedPart?.label ?? partQuery}
          />
          <SearchResults
            emptyLabel="No hay repuestos que coincidan."
            onSelect={(option) => {
              setSelectedPart(option);
              setPartQuery("");
            }}
            options={partMatches}
            selectedId={selectedPart?.id}
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="vehicleSearch"
          >
            Vehiculo por VIN
          </label>
          <Input
            autoComplete="off"
            id="vehicleSearch"
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
            onSelect={(option) => {
              setSelectedVehicle(option);
              setVehicleQuery("");
            }}
            options={vehicleMatches}
            selectedId={selectedVehicle?.id}
          />
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
        Seleccionado. Edita el campo para buscar otra opcion.
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
