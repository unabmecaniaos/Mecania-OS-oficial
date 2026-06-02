"use client";

import { ChangeEvent, useActionState, useEffect, useRef, useState } from "react";

import { createVehicleAction } from "@/app/(protected)/vehicles/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";

const VIN_READY_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

type VehicleFormProps = {
  clients: Array<{
    id: string;
    fullName: string;
  }>;
  defaultClientId?: string;
};

export function VehicleForm({ clients, defaultClientId }: VehicleFormProps) {
  const [state, formAction] = useActionState(createVehicleAction, initialActionState);
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [decodeStatus, setDecodeStatus] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const lastDecodedVin = useRef("");

  function handleVinChange(event: ChangeEvent<HTMLInputElement>) {
    setVin(event.target.value.replace(/\s+/g, "").toUpperCase());
  }

  useEffect(() => {
    const normalizedVin = vin.trim().toUpperCase();

    if (!normalizedVin) {
      setDecodeStatus(null);
      return;
    }

    if (normalizedVin.length < 17) {
      setDecodeStatus("Ingresa los 17 caracteres del VIN para autocompletar.");
      return;
    }

    if (!VIN_READY_PATTERN.test(normalizedVin)) {
      setDecodeStatus("El VIN debe tener 17 caracteres validos y no puede incluir I, O ni Q.");
      return;
    }

    if (lastDecodedVin.current === normalizedVin) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsDecoding(true);
      setDecodeStatus("Consultando datos del vehiculo...");

      try {
        const response = await fetch(
          `/api/vehicles/decode-vin?vin=${encodeURIComponent(normalizedVin)}`,
          {
            signal: controller.signal,
          },
        );
        const payload = (await response.json()) as {
          data?: {
            make: string | null;
            model: string | null;
            year: string | null;
          };
          error?: string;
        };

        if (!response.ok) {
          setDecodeStatus(payload.error ?? "No se pudo autocompletar el VIN.");
          return;
        }

        lastDecodedVin.current = normalizedVin;
        setMake((current) => current || payload.data?.make || "");
        setModel((current) => current || payload.data?.model || "");
        setYear((current) => current || payload.data?.year || "");
        setDecodeStatus(
          payload.data?.make || payload.data?.model || payload.data?.year
            ? "Datos autocompletados. Puedes corregirlos antes de guardar."
            : "VIN consultado, pero no se encontraron datos suficientes para autocompletar.",
        );
      } catch {
        if (!controller.signal.aborted) {
          setDecodeStatus("No se pudo consultar el VIN en este momento.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsDecoding(false);
        }
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [vin]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
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
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="plate">
            Patente
          </label>
          <Input id="plate" name="plate" placeholder="Opcional" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="vin">
            VIN
          </label>
          <Input
            autoComplete="off"
            id="vin"
            maxLength={17}
            name="vin"
            onChange={handleVinChange}
            placeholder="Identificador tecnico unico"
            value={vin}
          />
          {decodeStatus ? (
            <p className="text-sm text-[color:var(--muted)]">
              {isDecoding ? "Buscando: " : ""}
              {decodeStatus}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="make">
            Marca
          </label>
          <Input id="make" name="make" onChange={(event) => setMake(event.target.value)} value={make} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="model">
            Modelo
          </label>
          <Input
            id="model"
            name="model"
            onChange={(event) => setModel(event.target.value)}
            value={model}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="year">
            Ano
          </label>
          <Input
            id="year"
            name="year"
            onChange={(event) => setYear(event.target.value)}
            placeholder="2022"
            type="number"
            value={year}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="mileage">
            Kilometraje
          </label>
          <Input id="mileage" name="mileage" placeholder="Opcional" type="number" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="color">
            Color
          </label>
          <Input id="color" name="color" placeholder="Opcional" />
        </div>
      </div>

      <FormMessage message={state.error} />
      <SubmitButton
        className="w-full sm:w-auto"
        label="Registrar vehiculo"
        pendingLabel="Guardando vehiculo..."
      />
    </form>
  );
}
