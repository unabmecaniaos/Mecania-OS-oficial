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

  if (role === UserRole.LIQUIDATOR) {
    return "Liquidador";
  }

  return "Cliente";
}

function shortRoleLabel(role: UserRole) {
  if (role === UserRole.ADMIN) {
    return "Admin";
  }

  if (role === UserRole.MECHANIC) {
    return "Mecanico";
  }

  if (role === UserRole.LIQUIDATOR) {
    return "Liquidador";
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
    <div className="flex min-h-screen w-full gap-0 overflow-x-hidden bg-[#eef3f9]">
      <aside className="hidden w-[232px] shrink-0 border-r border-[#183452] bg-[#071c31] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.16)] lg:flex lg:flex-col">
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b5bd3] text-white">
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
                <path d="M12 3v3" />
                <path d="M12 18v3" />
                <path d="M3 12h3" />
                <path d="M18 12h3" />
                <path d="m5.6 5.6 2.1 2.1" />
                <path d="m16.3 16.3 2.1 2.1" />
                <path d="m18.4 5.6-2.1 2.1" />
                <path d="m7.7 16.3-2.1 2.1" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-white">MecaniaOS</p>
              <p className="text-xs text-[#9fb4cd]">Workshop Management</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex-1">
          <SidebarNav role={user.role} />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="relative z-50 border-b border-[#d5deea] bg-white/[0.92] px-4 py-3 backdrop-blur lg:flex lg:items-center lg:justify-between">
          <div className="relative hidden w-full max-w-[420px] lg:block">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              className="h-10 w-full rounded-full border border-[#c7d4e6] bg-[#f2f6fc] pl-11 pr-4 text-sm text-[#102033] outline-none transition placeholder:text-[#64748b] focus:border-[#0b5bd3] focus:bg-white focus:ring-4 focus:ring-[rgba(11,91,211,0.10)]"
              placeholder="Buscar por nombre, empresa o placa..."
              type="search"
            />
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <button
              aria-label="Notificaciones"
              className="rounded-full p-2 text-[#1f334d] transition hover:bg-[#eef4ff] hover:text-[#0b5bd3]"
              type="button"
            >
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
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </button>
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full px-1 py-1 outline-none transition focus-visible:ring-4 focus-visible:ring-[rgba(11,91,211,0.12)] [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-medium text-[#334155]">{shortRoleLabel(user.role)}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2670f2] font-semibold text-white shadow-[0_8px_20px_rgba(38,112,242,0.22)]">
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
              </summary>

              <div className="absolute right-0 top-[calc(100%+12px)] z-[90] w-[280px] rounded-[20px] border border-[#d7e0ec] bg-white p-4 shadow-[0_22px_50px_rgba(15,23,42,0.18)]">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#2670f2] font-semibold text-white">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-heading text-lg font-semibold text-[color:var(--foreground)]">
                      {user.name}
                    </p>
                    <p className="mt-1 truncate text-sm text-[color:var(--muted-strong)]">
                      {user.email}
                    </p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#0b5bd3]">
                      {roleLabel(user.role)}
                    </p>
                  </div>
                </div>

                <form action={onLogout} className="mt-4">
                  <Button className="w-full" type="submit" variant="secondary">
                    Cerrar sesion
                  </Button>
                </form>
              </div>
            </details>
          </div>
        </div>

        <div className="m-3 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-white/[0.88] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)] lg:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#5f7fa8]">MecaniaOS</p>
              <h1 className="mt-2 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
                Operacion del taller
              </h1>
              <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                Navegacion rapida y acciones clave adaptadas para oficina y taller.
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">{user.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                {roleLabel(user.role)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="no-scrollbar overflow-x-auto">
              <SidebarNav orientation="horizontal" role={user.role} />
            </div>
            <form action={onLogout}>
              <Button type="submit" variant="secondary">
                Salir
              </Button>
            </form>
          </div>
        </div>

        <main className="min-w-0 flex-1 px-4 py-5 md:px-6 lg:px-7">{children}</main>
      </div>
    </div>
  );
}
