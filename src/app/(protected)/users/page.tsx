import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { UserForm } from "@/app/(protected)/users/user-form";
import { UserRowForm } from "@/app/(protected)/users/user-row-form";
import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { getInternalRoleLabel, listInternalUsers } from "@/modules/users/user.service";

export default async function UsersPage() {
  const session = await getCurrentSession();

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const users = await listInternalUsers();
  const activeUsers = users.filter((user) => user.active).length;
  const mechanics = users.filter((user) => user.role === UserRole.MECHANIC).length;
  const liquidators = users.filter((user) => user.role === UserRole.LIQUIDATOR).length;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(239,246,255,0.94)_100%)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Control de acceso
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">Usuarios internos</h1>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroStat label="Activos" value={activeUsers} />
            <HeroStat label="Mecanicos" value={mechanics} />
            <HeroStat label="Liquidadores" value={liquidators} />
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="rounded-2xl">
          <h2 className="font-heading text-2xl font-semibold">Nuevo usuario</h2>
          <div className="mt-5">
            <UserForm />
          </div>
        </Card>

        <div className="space-y-3">
          {users.map((user) => (
            <Card className="rounded-xl px-5 py-4" key={user.id}>
              <div className="flex flex-col gap-2.5">
                <div>
                  <h2 className="font-heading text-xl font-semibold">{user.name}</h2>
                  <p className="mt-1.5 text-sm text-[color:var(--muted-strong)]">{user.email}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {getInternalRoleLabel(user.role)} / {user.active ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <UserRowForm user={user} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[rgba(37,99,235,0.12)] bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(37,99,235,0.06)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 font-heading text-3xl font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
