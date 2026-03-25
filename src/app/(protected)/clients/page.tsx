import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { listClients } from "@/modules/clients/client.service";

type ClientsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { q } = await searchParams;
  const clients = await listClients(q);
  const totalVehicles = clients.reduce((sum, client) => sum + client._count.vehicles, 0);
  const totalOrders = clients.reduce((sum, client) => sum + client._count.workOrders, 0);

  return (
    <div className="space-y-6">
      <Card className="rounded-[22px]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Gestion de clientes
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-white">
              Clientes del taller
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted-strong)]">
              Base de clientes, actividad asociada y acceso rapido a su contexto operativo.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-[520px]">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.6)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Clientes
                </p>
                <p className="mt-3 font-heading text-3xl font-semibold text-white">{clients.length}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.6)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Vehiculos
                </p>
                <p className="mt-3 font-heading text-3xl font-semibold text-white">{totalVehicles}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.6)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Ordenes
                </p>
                <p className="mt-3 font-heading text-3xl font-semibold text-white">{totalOrders}</p>
              </div>
            </div>

            <form className="flex flex-col gap-3 md:flex-row" method="get">
              <Input
                className="flex-1"
                defaultValue={q}
                name="q"
                placeholder="Buscar por nombre, correo o telefono"
              />
              <Button type="submit" variant="secondary">
                Buscar
              </Button>
              <Link href="/clients/new">
                <Button>Nuevo cliente</Button>
              </Link>
            </form>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {clients.map((client) => (
          <Card className="rounded-[20px] p-5" key={client.id}>
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent)]">
                      Cliente
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold text-white">
                      {client.fullName}
                    </h2>
                  </div>
                  <div className="rounded-full border border-[color:var(--border)] bg-[rgba(34,50,74,0.72)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-strong)]">
                    Activo
                  </div>
                </div>
                <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                  {client.phone} / {client.email}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  Creado el {formatDate(client.createdAt)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.64)] px-4 py-4 text-sm text-[color:var(--muted-strong)]">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    Vehiculos
                  </p>
                  <p className="mt-2 font-heading text-2xl font-semibold text-white">
                    {client._count.vehicles}
                  </p>
                </div>
                <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.64)] px-4 py-4 text-sm text-[color:var(--muted-strong)]">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    Ordenes
                  </p>
                  <p className="mt-2 font-heading text-2xl font-semibold text-white">
                    {client._count.workOrders}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[color:var(--border)] pt-4">
                <div className="rounded-full border border-[rgba(35,193,107,0.22)] bg-[rgba(35,193,107,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--success)]">
                  Cliente registrado
                </div>
                <Link
                  className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accent-strong)]"
                  href={`/clients/${client.id}`}
                >
                  Ver detalle
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {clients.length === 0 ? (
          <Card className="rounded-[20px] p-8 text-center xl:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Sin resultados
            </p>
            <p className="mt-3 text-[color:var(--muted-strong)]">
              No hay clientes que coincidan con la busqueda.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

