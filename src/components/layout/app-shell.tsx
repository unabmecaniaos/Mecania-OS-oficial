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
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-4 px-4 py-4 md:px-6 lg:px-8">
      <aside className="hidden w-[284px] shrink-0 rounded-2xl border border-[#17345e] bg-[linear-gradient(180deg,#0e223f_0%,#14325a_100%)] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.16)] lg:flex lg:flex-col">
        <div className="border-b border-white/10 pb-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#9ec1ff]">MecaniaOS</p>
          <h1 className="mt-3 font-heading text-[28px] font-semibold text-white">
            Operacion de taller
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#d7e5fb]">
            Consola interna para clientes, vehiculos, ordenes y seguimiento tecnico.
          </p>
        </div>

        <div className="mt-6 flex-1">
          <SidebarNav role={user.role} />
        </div>

        <div className="mt-6 rounded-xl border border-[#2e4b74] bg-[#1a3457] p-4">
          <p className="font-heading text-lg font-semibold text-white">{user.name}</p>
          <p className="mt-1 text-sm text-[#d7e5fb]">{user.email}</p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#9ec1ff]">
            {roleLabel(user.role)}
          </p>
          <form action={onLogout} className="mt-4">
            <Button
              className="w-full border-[#49698f] bg-[#27466f] !text-white hover:border-[#5c7aa2] hover:bg-[#2d4f7b]"
              type="submit"
              variant="ghost"
            >
              Cerrar sesion
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col gap-4">
        <header className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-white/[0.82] px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#5f7fa8]">
              Workspace interno
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-[color:var(--foreground)]">
              MecaniaOS
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted-strong)]">
              Operacion, trazabilidad y seguimiento tecnico desde una interfaz mas limpia y
              enfocada en el trabajo diario.
            </p>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">{user.name}</p>
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
