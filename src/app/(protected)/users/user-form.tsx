"use client";

import { useActionState, useState } from "react";
import { UserRole } from "@prisma/client";

import { createManagedUserAction } from "@/app/(protected)/users/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";

type UserFormProps = {
  clients: Array<{
    id: string;
    fullName: string;
    email: string;
    user: {
      id: string;
    } | null;
  }>;
};

export function UserForm({ clients }: UserFormProps) {
  const [state, formAction] = useActionState(createManagedUserAction, initialActionState);
  const [role, setRole] = useState<UserRole>(UserRole.MECHANIC);
  const availableClients = clients.filter((client) => !client.user);
  const requiresClient = role === UserRole.CUSTOMER;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="name">
            Nombre
          </label>
          <Input id="name" name="name" placeholder="Nombre del usuario" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="email">
            Correo
          </label>
          <Input id="email" name="email" placeholder="usuario@correo.com" type="email" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="password">
            Contrasena inicial
          </label>
          <Input id="password" name="password" placeholder="Minimo 8 caracteres" type="password" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="role">
            Rol
          </label>
          <Select
            defaultValue={UserRole.MECHANIC}
            id="role"
            name="role"
            onChange={(event) => setRole(event.target.value as UserRole)}
          >
            <option value={UserRole.ADMIN}>Administrador</option>
            <option value={UserRole.MECHANIC}>Mecanico</option>
            <option value={UserRole.CUSTOMER}>Cliente</option>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            className="text-sm font-medium text-[color:var(--muted-strong)]"
            htmlFor="clientId"
          >
            Cliente vinculado
          </label>
          <Select
            className={!requiresClient ? "opacity-60" : undefined}
            defaultValue=""
            disabled={!requiresClient}
            id="clientId"
            name="clientId"
            required={requiresClient}
          >
            <option value="">
              {requiresClient ? "Selecciona un cliente" : "No aplica para este rol"}
            </option>
            {availableClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName} / {client.email}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <FormMessage message={state.error} />
      <SubmitButton label="Crear usuario" pendingLabel="Creando usuario..." />
    </form>
  );
}
