"use client";

import { useActionState } from "react";
import { UserRole } from "@prisma/client";

import { updateInternalUserAction } from "@/app/(protected)/users/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/form-state";

type UserRowFormProps = {
  user: {
    id: string;
    role: UserRole;
    active: boolean;
  };
};

export function UserRowForm({ user }: UserRowFormProps) {
  const [state, formAction] = useActionState(updateInternalUserAction, initialActionState);

  return (
    <div className="flex items-center gap-2">
      <details className="group relative">
        <summary
          aria-label="Editar usuario"
          className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-[var(--radius-control)] text-[color:var(--accent)] outline-none transition hover:bg-[color:var(--info-soft)] focus-visible:ring-4 focus-visible:ring-[rgba(36,88,198,0.14)] [&::-webkit-details-marker]:hidden"
          title="Editar usuario"
        >
          <EditIcon />
        </summary>

        <div className="absolute right-0 z-20 mt-2 w-[min(88vw,360px)] rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--shadow-panel-hover)]">
          <form action={formAction} className="space-y-3">
            <input name="userId" type="hidden" value={user.id} />

            <div className="space-y-2">
              <label className="ui-field-label" htmlFor={`role-${user.id}`}>
                Rol
              </label>
              <Select defaultValue={user.role} id={`role-${user.id}`} name="role">
                <option value={UserRole.ADMIN}>Administrador</option>
                <option value={UserRole.MECHANIC}>Mecanico</option>
                <option value={UserRole.LIQUIDATOR}>Liquidador</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="ui-field-label" htmlFor={`password-${user.id}`}>
                Nueva contrasena
              </label>
              <Input
                id={`password-${user.id}`}
                name="password"
                placeholder="Opcional"
                type="password"
              />
            </div>

            <label className="flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 text-sm font-medium text-[color:var(--muted-strong)]">
              <input defaultChecked={user.active} name="active" type="checkbox" />
              Usuario activo
            </label>

            <FormMessage message={state.error} />
            <SubmitButton
              className="w-full"
              label="Guardar cambios"
              pendingLabel="Guardando..."
            />
          </form>
        </div>
      </details>

      <form action={formAction}>
        <input name="userId" type="hidden" value={user.id} />
        <input name="role" type="hidden" value={user.role} />
        <input name="password" type="hidden" value="" />
        <Button
          aria-label="Desactivar usuario"
          className="h-9 w-9 px-0"
          disabled={!user.active}
          size="sm"
          title={user.active ? "Desactivar usuario" : "Usuario inactivo"}
          type="submit"
          variant="danger"
        >
          <TrashIcon />
        </Button>
      </form>
    </div>
  );
}

function EditIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}
