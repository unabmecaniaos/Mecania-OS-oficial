"use client";

import { useState, type ReactNode } from "react";

import { UserRole } from "@prisma/client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return collapsed ? (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-4 px-4 py-4 md:px-6 lg:px-8">
      <aside
        className={cn(
          "hidden shrink-0 rounded-2xl border border-[#17345e] bg-[linear-gradient(180deg,#0e223f_0%,#14325a_100%)] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.16)] transition-all duration-300 lg:flex lg:flex-col",
          isSidebarCollapsed ? "w-[96px]" : "w-[284px]",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-5">
          <div
            className={cn(
              "min-w-0 transition-all duration-300",
              isSidebarCollapsed ? "pointer-events-none max-w-0 overflow-hidden opacity-0" : "max-w-full opacity-100",
            )}
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#9ec1ff]">MecaniaOS</p>
            <h1 className="mt-3 font-heading text-[28px] font-semibold text-white">
              Operacion de taller
            </h1>
          </div>

          <Button
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            className="min-h-10 rounded-full border border-[#35567f] bg-[#17345e] px-3 text-white transition-all duration-300 hover:bg-[#1d416f]"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <SidebarToggleIcon collapsed={isSidebarCollapsed} />
          </Button>
        </div>

        <div className="mt-6 flex-1 overflow-hidden">
          <SidebarNav collapsed={isSidebarCollapsed} role={user.role} />
        </div>

        <div
          className={cn(
            "mt-6 rounded-xl border border-[#2e4b74] bg-[#1a3457] p-4 transition-all duration-300",
            isSidebarCollapsed ? "px-2 py-3" : "px-4 py-4",
          )}
        >
          <div
            className={cn(
              "transition-all duration-300",
              isSidebarCollapsed ? "pointer-events-none h-0 overflow-hidden opacity-0" : "h-auto opacity-100",
            )}
          >
            <p className="font-heading text-lg font-semibold text-white">{user.name}</p>
            <p className="mt-1 text-sm text-[#d7e5fb]">{user.email}</p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#9ec1ff]">
              {roleLabel(user.role)}
            </p>
          </div>

          <form action={onLogout} className={cn(isSidebarCollapsed ? "mt-0" : "mt-4")}>
            <Button
              className={cn(
                "border-[#49698f] bg-[#27466f] !text-white hover:border-[#5c7aa2] hover:bg-[#2d4f7b] transition-all duration-300",
                isSidebarCollapsed ? "w-full px-0" : "w-full",
              )}
              title={isSidebarCollapsed ? "Cerrar sesion" : undefined}
              type="submit"
              variant="ghost"
            >
              {isSidebarCollapsed ? "Salir" : "Cerrar sesion"}
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col gap-4 transition-all duration-300">
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/[0.88] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)] lg:hidden">
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

        <main className="min-w-0 flex-1 pb-8 transition-all duration-300">{children}</main>
      </div>
    </div>
  );
}
