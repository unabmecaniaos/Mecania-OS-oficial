import type { ReactNode } from "react";

import { UserRole } from "@prisma/client";

import { BrandMark } from "@/components/brand/brand-mark";
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
          <div className="flex items-center gap-3">
            <BrandMark
              className="drop-shadow-[0_8px_14px_rgba(0,119,255,0.28)]"
              priority
              size={46}
            />
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#9ec1ff]">
                MecaniaOS
              </p>
              <h1 className="mt-1 font-heading text-xl font-semibold text-white">
                Operacion de taller
              </h1>
            </div>
          </div>
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
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/[0.88] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)] lg:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <BrandMark priority size={42} />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#5f7fa8]">
                    MecaniaOS
                  </p>
                  <h1 className="mt-1 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
                    Operacion del taller
                  </h1>
                </div>
              </div>
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

        <main className="pb-8">{children}</main>
      </div>
    </div>
  );
}
