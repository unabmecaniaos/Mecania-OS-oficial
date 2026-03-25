import type { ReactNode } from "react";

import { UserRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/sidebar-nav";

function roleLabel(role: UserRole) {
  if (role === UserRole.ADMIN) {
    return "Administrador";
  }

  if (role === UserRole.MECHANIC) {
    return "Mecanico";
  }

  return "Cliente";
}

type AppShellProps = {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
  onLogout: () => Promise<void>;
};

export function AppShell({ children, user, onLogout }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1680px] gap-4 px-3 py-3 md:px-5 md:py-5 lg:px-6">
      <aside className="hidden w-[296px] shrink-0 rounded-[22px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#0c1726_0%,#101b2d_100%)] p-5 shadow-[var(--shadow-lg)] lg:flex lg:flex-col">
        <div className="border-b border-white/8 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(55,168,255,0.32)] bg-[linear-gradient(180deg,#2498ff_0%,#1774ff_100%)] text-sm font-bold tracking-[0.2em] text-white">
              MO
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--accent)]">
                MecaniaOS
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted-strong)]">Control operativo</p>
            </div>
          </div>

          <h1 className="mt-5 font-heading text-[30px] font-semibold leading-tight text-white">
            Taller en tiempo real
          </h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
            Recepcion, ordenes, vehiculos y seguimiento tecnico en una sola consola.
          </p>
        </div>

        <div className="mt-6 flex-1">
          <SidebarNav />
        </div>

        <div className="mt-6 rounded-[18px] border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,rgba(34,50,74,0.92)_0%,rgba(22,34,53,0.98)_100%)] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[color:var(--surface-elevated)] text-sm font-semibold text-white">
              {user.name
                .split(" ")
                .map((chunk) => chunk[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-lg font-semibold text-white">{user.name}</p>
              <p className="truncate text-sm text-[color:var(--muted-strong)]">{user.email}</p>
            </div>
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-[color:var(--accent)]">
            {roleLabel(user.role)}
          </p>
          <form action={onLogout} className="mt-4">
            <Button
              className="w-full"
              type="submit"
              variant="secondary"
            >
              Cerrar sesion
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col gap-4">
        <header className="flex flex-col gap-4 rounded-[22px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(18,28,45,0.94)_0%,rgba(15,24,39,0.98)_100%)] px-5 py-5 shadow-[var(--shadow-md)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Inicio / Taller / Operacion
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-white">
              Centro de control
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted-strong)]">
              Una vista unica para gestionar trabajo activo, contexto del taller y proxima accion.
            </p>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                {roleLabel(user.role)}
              </p>
            </div>
            <form action={onLogout}>
              <Button type="submit" variant="secondary">
                Salir
              </Button>
            </form>
          </div>
        </header>

        <main className="pb-8">{children}</main>
      </div>
    </div>
  );
}
