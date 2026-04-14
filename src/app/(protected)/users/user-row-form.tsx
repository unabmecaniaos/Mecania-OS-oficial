"use client";

import { useActionState, useState } from "react";
import { UserRole } from "@prisma/client";

import {
  deleteManagedUserAction,
  updateManagedUserAction,
} from "@/app/(protected)/users/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";

type UserRowFormProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
    client: {
      id: string;
      fullName: string;
      email: string;
    } | null;
  };
  clients: Array<{
    id: string;
    fullName: string;
    email: string;
    user: {
      id: string;
    } | null;
  }>;
  isCurrentUser: boolean;
};

export function UserRowForm({ user, clients, isCurrentUser }: UserRowFormProps) {
  const [updateState, updateAction] = useActionState(updateManagedUserAction, initialActionState);
  const [deleteState, deleteAction] = useActionState(deleteManagedUserAction, initialActionState);
  const [role, setRole] = useState<UserRole>(user.role);
  const requiresClient = role === UserRole.CUSTOMER;
  const availableClients = clients.filter(
    (client) => !client.user || client.user.id === user.id,
  );

  return (
    <div className="space-y-3">
      <form action={updateAction} className="space-y-3">
        <input name="userId" type="hidden" value={user.id} />
        {isCurrentUser ? (
          <input name="activeLocked" type="hidden" value={user.active ? "true" : "false"} />
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <Input defaultValue={user.name} name="name" placeholder="Nombre del usuario" />
          <Input defaultValue={user.email} name="email" placeholder="usuario@correo.com" type="email" />
          <Select
            defaultValue={user.role}
            name="role"
            onChange={(event) => setRole(event.target.value as UserRole)}
          >
            <option value={UserRole.ADMIN}>Administrador</option>
            <option value={UserRole.MECHANIC}>Mecanico</option>
            <option value={UserRole.CUSTOMER}>Cliente</option>
          </Select>
          <Select
            className={!requiresClient ? "opacity-60" : undefined}
            defaultValue={user.client?.id ?? ""}
            disabled={!requiresClient}
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
          <Input
            className="md:col-span-2"
            name="password"
            placeholder="Nueva contrasena opcional"
            type="password"
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex items-center gap-2 rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--muted-strong)]">
            <input
              defaultChecked={user.active}
              disabled={isCurrentUser}
              name="active"
              type="checkbox"
            />
            Activo
          </label>

          <div className="flex flex-wrap gap-3">
            <SubmitButton label="Guardar cambios" pendingLabel="Guardando..." />
          </div>
        </div>
        <FormMessage message={updateState.error} />
      </form>

      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (!window.confirm(`Se eliminara la cuenta de ${user.name}. Esta accion no se puede deshacer.`)) {
            event.preventDefault();
          }
        }}
      >
        <input name="userId" type="hidden" value={user.id} />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-[color:var(--muted)]">
            {isCurrentUser
              ? "Tu sesion actual no puede eliminarse ni desactivarse desde este panel."
              : "El borrado solo procede si la cuenta no tiene trazabilidad operativa asociada."}
          </p>
          <Button
            className="border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] hover:border-[#fca5a5] hover:bg-[#fee2e2] hover:text-[#991b1b]"
            disabled={isCurrentUser}
            type="submit"
            variant="secondary"
          >
            Eliminar usuario
          </Button>
        </div>
        <FormMessage message={deleteState.error} />
      </form>
    </div>
  );
}
