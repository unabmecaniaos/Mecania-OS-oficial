import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoveToTrashButton, SectionTrashLink } from "@/components/trash/trash-ui";
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
      <Card className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(239,246,255,0.94)_100%)]">
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Registro comercial
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold">Clientes del taller</h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat label="Clientes visibles" value={clients.length} />
              <HeroStat label="Vehiculos ligados" value={totalVehicles} />
              <HeroStat label="Ordenes ligadas" value={totalOrders} />
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <form className="flex flex-col gap-3 sm:flex-row xl:min-w-[520px]" method="get">
              <Input defaultValue={q} name="q" placeholder="Buscar por nombre, correo o telefono" />
              <Button className="sm:min-w-[120px]" type="submit" variant="secondary">
                Buscar
              </Button>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/clients/new">
                <Button className="w-full sm:w-auto">Nuevo cliente</Button>
              </Link>
              <SectionTrashLink href="/clients/trash" />
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {clients.map((client) => (
          <Card className="rounded-xl" key={client.id}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-heading text-2xl font-semibold">{client.fullName}</h2>
                  <span className="rounded-full border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                    Cliente taller
                  </span>
                </div>
                <p className="text-sm text-[color:var(--muted-strong)]">
                  {client.phone} / {client.email}
                </p>
                <p className="text-sm text-[color:var(--muted)]">
                  Creado el {formatDate(client.createdAt)}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:items-center">
                <MoveToTrashButton entityId={client.id} entityType="client" redirectTo="/clients" />
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-medium">
                    {client._count.vehicles} vehiculos
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-medium">
                    {client._count.workOrders} ordenes
                  </div>
                  <Link
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                    href={`/clients/${client.id}`}
                  >
                    Ver ficha
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {clients.length === 0 ? (
          <Card className="rounded-xl text-center">
            <p className="text-[color:var(--muted-strong)]">
              No hay clientes del taller que coincidan con la busqueda.
            </p>
          </Card>
        ) : null}
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
