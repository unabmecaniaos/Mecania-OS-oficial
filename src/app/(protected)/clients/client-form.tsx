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
      <div className="rounded-[20px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.48)] p-5">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Identidad
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Datos principales para registrar al cliente.
          </p>
        </div>

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
        </div>
      </div>

      <div className="rounded-[20px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.48)] p-5">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Contacto
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Canales para coordinar seguimiento y aprobaciones.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
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
      </div>

      <div className="rounded-[20px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.48)] p-5">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Contexto
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Informacion complementaria para gestion comercial y operativa.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="address">
            Direccion
          </label>
          <Textarea id="address" name="address" placeholder="Direccion opcional del cliente" />
        </div>
      </div>

      <FormMessage message={state.error} />
      <div className="flex justify-end border-t border-[color:var(--border)] pt-5">
        <SubmitButton label="Crear cliente" pendingLabel="Creando cliente..." />
      </div>
    </form>
  );
}
