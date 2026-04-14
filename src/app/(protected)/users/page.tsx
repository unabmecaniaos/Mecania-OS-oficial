import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { UserForm } from "@/app/(protected)/users/user-form";
import { UserRowForm } from "@/app/(protected)/users/user-row-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { getCurrentSession } from "@/modules/auth/auth.service";
import {
  getUserRoleLabel,
  listAssignableClients,
  listUsers,
} from "@/modules/users/user.service";

type UsersPageProps = {
  searchParams: Promise<{
    q?: string;
    role?: UserRole;
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await getCurrentSession();

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const { q, role } = await searchParams;
  const [users, clients] = await Promise.all([
    listUsers({
      q,
      role,
    }),
    listAssignableClients(),
  ]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Control de acceso
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">
              Administracion de usuarios
            </h1>
            <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
              Gestiona cuentas de administradores, mecanicos y clientes desde un solo panel.
            </p>
          </div>

          <form className="flex flex-col gap-3 md:flex-row" method="get">
            <Input
              defaultValue={q}
              name="q"
              placeholder="Buscar por nombre, correo o cliente vinculado"
            />
            <Select defaultValue={role ?? ""} name="role">
              <option value="">Todos los roles</option>
              <option value={UserRole.ADMIN}>Administrador</option>
              <option value={UserRole.MECHANIC}>Mecanico</option>
              <option value={UserRole.CUSTOMER}>Cliente</option>
            </Select>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </form>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-2xl">
          <h2 className="font-heading text-2xl font-semibold">Nueva cuenta</h2>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Para cuentas de cliente, selecciona la ficha del cliente que tendra acceso al portal.
          </p>
          <div className="mt-5">
            <UserForm clients={clients} />
          </div>
        </Card>

        <div className="space-y-4">
          {users.map((user) => (
            <Card className="rounded-2xl" key={user.id}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-heading text-2xl font-semibold">{user.name}</h2>
                      <span className="rounded-full bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)]">
                        {getUserRoleLabel(user.role)}
                      </span>
                      {!user.active ? (
                        <span className="rounded-full bg-[#fef2f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#b91c1c]">
                          Inactivo
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--muted-strong)]">{user.email}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Creado el {formatDate(user.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {user.client
                        ? `Cliente vinculado: ${user.client.fullName}`
                        : "Sin cliente vinculado"}
                    </p>
                  </div>
                </div>

                <UserRowForm
                  clients={clients}
                  isCurrentUser={session.user.id === user.id}
                  user={user}
                />
              </div>
            </Card>
          ))}

          {users.length === 0 ? (
            <Card className="rounded-xl text-center">
              <p className="text-[color:var(--muted-strong)]">
                No hay usuarios que coincidan con esos filtros.
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
