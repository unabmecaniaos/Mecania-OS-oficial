import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { UserForm } from "@/app/(protected)/users/user-form";
import { UserRowForm } from "@/app/(protected)/users/user-row-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { getInternalRoleLabel, listInternalUsers } from "@/modules/users/user.service";

const roleCards = [
  {
    label: "Administrador",
    tone: "admin",
    items: ["Acceso total", "Gestionar usuarios", "Ver reportes"],
  },
  {
    label: "Mecanico",
    tone: "mechanic",
    items: ["Ver vehiculos asignados", "Actualizar estado", "Subir fotos"],
  },
  {
    label: "Liquidador",
    tone: "liquidator",
    items: ["Ver casos derivados", "Revisar presupuestos", "Responder aprobaciones"],
  },
  {
    label: "Cliente",
    tone: "customer",
    items: ["Ver estado propio", "Autoinspeccion", "Recibir notificaciones"],
  },
] as const;

export default async function UsersPage() {
  const session = await getCurrentSession();

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const users = await listInternalUsers();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">
            Gestion de Usuarios
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Administrar usuarios y permisos del sistema
          </p>
        </div>

        <details className="group relative">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-[var(--radius-control)] border border-transparent bg-[linear-gradient(180deg,var(--accent)_0%,var(--accent-strong)_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-control)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(36,88,198,0.24)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(36,88,198,0.16)] [&::-webkit-details-marker]:hidden">
            <span className="text-xl leading-none">+</span>
            Nuevo Usuario
          </summary>

          <Card className="absolute right-0 z-30 mt-3 w-[min(92vw,760px)]">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Alta de usuario
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold">Nuevo usuario</h2>
            </div>
            <UserForm />
          </Card>
        </details>
      </section>

      <Card>
        <div className="flex items-center gap-3">
          <ShieldIcon />
          <h2 className="font-heading text-xl font-semibold text-[color:var(--foreground)]">
            Roles y Permisos
          </h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roleCards.map((role) => (
            <div
              className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4"
              key={role.label}
            >
              <RolePill label={role.label} tone={role.tone} />
              <ul className="mt-4 space-y-2 text-sm leading-5 text-[color:var(--muted-strong)]">
                {role.items.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="hidden grid-cols-[1.35fr_1.1fr_0.85fr_0.7fr_130px] gap-4 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] px-6 py-4 text-sm font-semibold text-[color:var(--muted-strong)] lg:grid">
          <span>Usuario</span>
          <span>Correo</span>
          <span>Rol</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        <div className="divide-y divide-[color:var(--border)]">
          {users.map((user) => (
            <div
              className="grid gap-4 px-5 py-4 lg:grid-cols-[1.35fr_1.1fr_0.85fr_0.7fr_130px] lg:items-center lg:px-6"
              key={user.id}
            >
              <div className="flex min-w-0 items-center gap-4">
                <UserAvatar />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[color:var(--foreground)]">
                    {user.name}
                  </p>
                  <p className="mt-1 truncate text-sm text-[color:var(--muted)] lg:hidden">
                    {user.email}
                  </p>
                </div>
              </div>

              <p className="hidden truncate text-sm text-[color:var(--muted-strong)] lg:block">
                {user.email}
              </p>

              <div>
                <RoleBadge role={user.role} />
              </div>

              <div>
                <Badge tone={user.active ? "success" : "neutral"}>
                  {user.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <UserRowForm user={user} />
            </div>
          ))}

          {users.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[color:var(--muted)]">
              No hay usuarios internos registrados.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function RolePill({
  label,
  tone,
}: {
  label: string;
  tone: (typeof roleCards)[number]["tone"];
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-sm font-semibold",
        tone === "admin" &&
          "border-[rgba(147,51,234,0.18)] bg-[rgba(147,51,234,0.10)] text-[#7e22ce]",
        tone === "mechanic" &&
          "border-[rgba(20,122,75,0.2)] bg-[color:var(--success-soft)] text-[color:var(--success)]",
        tone === "liquidator" &&
          "border-[rgba(36,88,198,0.2)] bg-[color:var(--info-soft)] text-[color:var(--accent)]",
        tone === "customer" &&
          "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--muted-strong)]",
      )}
    >
      {label}
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === UserRole.ADMIN) {
    return (
      <Badge className="border-[rgba(147,51,234,0.18)] bg-[rgba(147,51,234,0.10)] text-[#7e22ce]">
        {getInternalRoleLabel(role)}
      </Badge>
    );
  }

  if (role === UserRole.MECHANIC) {
    return <Badge tone="success">{getInternalRoleLabel(role)}</Badge>;
  }

  if (role === UserRole.LIQUIDATOR) {
    return <Badge tone="info">{getInternalRoleLabel(role)}</Badge>;
  }

  return <Badge>{getInternalRoleLabel(role)}</Badge>;
}

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-[color:var(--foreground)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      <path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z" />
    </svg>
  );
}

function UserAvatar() {
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--info-soft)] text-[color:var(--accent)]">
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    </div>
  );
}
