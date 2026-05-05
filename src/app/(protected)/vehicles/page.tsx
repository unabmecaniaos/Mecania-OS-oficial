import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoveToTrashButton, SectionTrashLink } from "@/components/trash/trash-ui";
import { formatDate } from "@/lib/utils";
import { listVehicles } from "@/modules/vehicles/vehicle.service";

type VehiclesPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
  const { q } = await searchParams;
  const vehicles = await listVehicles(q);
  const totalOrders = vehicles.reduce((sum, vehicle) => sum + vehicle._count.workOrders, 0);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(239,246,255,0.94)_100%)]">
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Registro vehicular
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold">Vehiculos del taller</h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <HeroStat label="Vehiculos visibles" value={vehicles.length} />
              <HeroStat label="Ordenes asociadas" value={totalOrders} />
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <form className="flex flex-col gap-3 sm:flex-row xl:min-w-[520px]" method="get">
              <Input defaultValue={q} name="q" placeholder="Buscar por VIN, patente o cliente" />
              <Button className="sm:min-w-[120px]" type="submit" variant="secondary">
                Buscar
              </Button>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/vehicles/new">
                <Button className="w-full sm:w-auto">Nuevo vehiculo</Button>
              </Link>
              <SectionTrashLink href="/vehicles/trash" />
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {vehicles.map((vehicle) => (
          <Card className="rounded-xl" key={vehicle.id}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-heading text-2xl font-semibold">
                    {vehicle.make} {vehicle.model}
                  </h2>
                  <span className="rounded-full border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                    {vehicle.plate ?? "Sin patente"}
                  </span>
                </div>
                <p className="text-sm text-[color:var(--muted-strong)]">
                  {vehicle.client.fullName}
                </p>
                <p className="text-sm text-[color:var(--muted)]">
                  VIN {vehicle.vin} / Registrado {formatDate(vehicle.createdAt)}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:items-center">
                <MoveToTrashButton entityId={vehicle.id} entityType="vehicle" redirectTo="/vehicles" />
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-medium">
                    {vehicle._count.workOrders} ordenes
                  </div>
                  <Link
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                    href={`/vehicles/${vehicle.id}`}
                  >
                    Ver ficha
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {vehicles.length === 0 ? (
          <Card className="rounded-xl text-center">
            <p className="text-[color:var(--muted-strong)]">
              No hay vehiculos para mostrar con este filtro.
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
