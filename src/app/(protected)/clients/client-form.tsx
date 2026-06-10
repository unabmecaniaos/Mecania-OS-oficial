"use client";

import { useActionState } from "react";

import { createClientAction } from "@/app/(protected)/clients/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";

export function ClientForm() {
  const [state, formAction] = useActionState(createClientAction, initialActionState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="fullName">
            Nombre completo
          </label>
          <Input id="fullName" name="fullName" placeholder="Nombre del cliente" />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="localIdentifier"
          >
            RUT o identificador
          </label>
          <Input id="localIdentifier" name="localIdentifier" placeholder="Opcional" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="phone">
            Telefono
          </label>
          <Input id="phone" name="phone" placeholder="+56 9 ..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="email">
            Correo
          </label>
          <Input id="email" name="email" placeholder="cliente@correo.com" type="email" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="address">
          Direccion
        </label>
        <Textarea id="address" name="address" placeholder="Direccion opcional del cliente" />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[color:var(--muted-strong)]"
          htmlFor="portalPassword"
        >
          Contrasena del portal
        </label>
        <Input
          id="portalPassword"
          name="portalPassword"
          placeholder="Opcional, minimo 8 caracteres"
          type="password"
        />
        <p className="text-xs text-[color:var(--muted)]">
          Si completas este campo, el cliente quedara con acceso habilitado al portal usando su
          correo.
        </p>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Siguiente paso
          </p>
          <h2 className="font-heading text-xl font-semibold text-[color:var(--foreground)]">
            Vehiculo inicial
          </h2>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="vehicleVin"
            >
              VIN
            </label>
            <Input id="vehicleVin" name="vehicleVin" placeholder="17 caracteres" />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="vehiclePlate"
            >
              Patente
            </label>
            <Input id="vehiclePlate" name="vehiclePlate" placeholder="Opcional" />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="vehicleMake"
            >
              Marca
            </label>
            <Input id="vehicleMake" name="vehicleMake" placeholder="Toyota" />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="vehicleModel"
            >
              Modelo
            </label>
            <Input id="vehicleModel" name="vehicleModel" placeholder="Corolla" />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="vehicleYear"
            >
              Ano
            </label>
            <Input id="vehicleYear" name="vehicleYear" placeholder="2020" type="number" />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="vehicleMileage"
            >
              Kilometraje
            </label>
            <Input id="vehicleMileage" name="vehicleMileage" placeholder="Opcional" type="number" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="vehicleColor"
            >
              Color
            </label>
            <Input id="vehicleColor" name="vehicleColor" placeholder="Opcional" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.04)] p-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[#1d4ed8]">
            Recepcion de taller
          </p>
          <h2 className="font-heading text-xl font-semibold text-[color:var(--foreground)]">
            Inspeccion mecanica inicial
          </h2>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="inspectionMainComplaint"
            >
              Motivo o sintoma principal
            </label>
            <Textarea
              id="inspectionMainComplaint"
              name="inspectionMainComplaint"
              placeholder="Ej. Golpe delantero, ruido al frenar, perdida de potencia"
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[color:var(--muted-strong)]"
              htmlFor="inspectionNotes"
            >
              Observaciones internas
            </label>
            <Textarea
              id="inspectionNotes"
              name="inspectionNotes"
              placeholder="Notas del mecanico al recibir el vehiculo"
            />
          </div>
        </div>
      </div>

      <FormMessage message={state.error} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SubmitButton
          className="w-full lg:w-auto"
          label="Guardar cliente"
          name="nextStep"
          pendingLabel="Creando cliente..."
          value="list"
          variant="secondary"
        />
        <SubmitButton
          className="w-full lg:w-auto"
          label="Guardar y agregar vehiculo"
          name="nextStep"
          pendingLabel="Preparando vehiculo..."
          value="vehicle"
          variant="secondary"
        />
        <SubmitButton
          className="w-full lg:w-auto"
          label="Guardar y ver inspeccion"
          name="nextStep"
          pendingLabel="Guardando inspeccion..."
          value="inspection"
        />
      </div>
    </form>
  );
}
