"use client";

import Link from "next/link";
import { ChangeEvent, useActionState, useState } from "react";

import { createInsuranceCaseAction } from "@/app/liquidador/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";

export function InsuranceCaseForm() {
  const [state, formAction] = useActionState(createInsuranceCaseAction, initialActionState);
  const [ownerName, setOwnerName] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  function handleUppercase(event: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) {
    setter(event.target.value.toUpperCase());
  }

  return (
    <form action={formAction} className="space-y-6">
      <Card className="rounded-2xl">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="ownerFullName"
            >
              Titular del vehiculo
            </label>
            <Input
              id="ownerFullName"
              name="ownerFullName"
              onChange={(event) => setOwnerName(event.target.value)}
              placeholder="Nombre completo del dueno"
              value={ownerName}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="ownerPhone"
            >
              Telefono del titular
            </label>
            <Input id="ownerPhone" name="ownerPhone" placeholder="Ej. +56 9 1234 5678" />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="ownerEmail"
            >
              Correo del titular
            </label>
            <Input
              id="ownerEmail"
              name="ownerEmail"
              placeholder="Ej. titular@correo.cl"
              type="email"
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="ownerAddress"
            >
              Direccion
            </label>
            <Input id="ownerAddress" name="ownerAddress" placeholder="Direccion del titular" />
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="plate">
              Patente
            </label>
            <Input
              id="plate"
              name="plate"
              onChange={(event) => handleUppercase(event, setPlate)}
              placeholder="Ej. ABCD12"
              value={plate}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="vin">
              VIN
            </label>
            <Input
              id="vin"
              name="vin"
              onChange={(event) => handleUppercase(event, setVin)}
              placeholder="VIN del vehiculo"
              value={vin}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="make">
              Marca
            </label>
            <Input
              id="make"
              name="make"
              onChange={(event) => setMake(event.target.value)}
              placeholder="Ej. Toyota"
              value={make}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="model">
              Modelo
            </label>
            <Input
              id="model"
              name="model"
              onChange={(event) => setModel(event.target.value)}
              placeholder="Ej. Corolla"
              value={model}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="year">
              Anio
            </label>
            <Input
              id="year"
              name="year"
              onChange={(event) => setYear(event.target.value)}
              placeholder="Ej. 2021"
              type="number"
              value={year}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="color">
              Color
            </label>
            <Input id="color" name="color" placeholder="Ej. Gris plata" />
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
          Resumen del caso
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Titular
            </p>
            <p className="mt-2 font-semibold text-[color:var(--foreground)]">
              {ownerName || "Pendiente"}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Vehiculo
            </p>
            <p className="mt-2 font-semibold text-[color:var(--foreground)]">
              {make && model ? `${make} ${model}` : "Pendiente"}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Patente
            </p>
            <p className="mt-2 font-semibold text-[color:var(--foreground)]">
              {plate || "Sin patente"}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
              VIN / Anio
            </p>
            <p className="mt-2 font-semibold text-[color:var(--foreground)]">
              {vin || "Pendiente"}
              {year ? ` / ${year}` : ""}
            </p>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="claimNumber"
            >
              Numero de siniestro
            </label>
            <Input id="claimNumber" name="claimNumber" placeholder="Ej. CLM-2026-00045" />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="policyNumber"
            >
              Poliza
            </label>
            <Input id="policyNumber" name="policyNumber" placeholder="Ej. POL-8430201" />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="incidentDate"
            >
              Fecha del choque
            </label>
            <Input id="incidentDate" name="incidentDate" type="date" />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="incidentLocation"
            >
              Lugar del siniestro
            </label>
            <Input
              id="incidentLocation"
              name="incidentLocation"
              placeholder="Ej. Av. Kennedy con Manquehue"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="description"
            >
              Descripcion del dano
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe el impacto, las zonas afectadas y cualquier contexto relevante para el taller."
            />
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="photos">
            Fotos iniciales del choque
          </label>
          <Input
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            id="photos"
            multiple
            name="photos"
            type="file"
          />
          <p className="text-sm text-[color:var(--muted)]">
            Estas imagenes quedan disponibles para que el taller revise el siniestro y arme el
            presupuesto sin incorporar al titular al modulo de clientes del taller.
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/liquidador">
          <Button type="button" variant="secondary">
            Volver al portal
          </Button>
        </Link>
        <SubmitButton label="Registrar siniestro" pendingLabel="Registrando..." />
      </div>

      <FormMessage message={state.error} />
    </form>
  );
}
