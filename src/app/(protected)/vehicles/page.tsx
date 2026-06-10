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
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">
            Vehiculos del taller
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Consulta autos registrados, VIN, patente y actividad asociada.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <HeroStat label="Vehiculos visibles" value={vehicles.length} />
          <HeroStat label="Ordenes asociadas" value={totalOrders} />
        </div>
      </section>

      <Card className="rounded-[22px] bg-white">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] xl:min-w-[520px]" method="get">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Buscar
              </label>
              <Input defaultValue={q} name="q" placeholder="VIN, patente o cliente" />
            </div>
            <div className="flex items-end">
              <Button className="w-full sm:w-auto" type="submit" variant="secondary">
                Buscar
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
            <Link href="/vehicles/new">
              <Button className="w-full sm:w-auto">Nuevo vehiculo</Button>
            </Link>
            <SectionTrashLink href="/vehicles/trash" />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {vehicles.map((vehicle) => (
          <Card className="flex min-h-[286px] flex-col rounded-[22px] bg-white p-5" key={vehicle.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#eef4ff] text-sm font-bold text-[#1d4ed8]">
                VH
              </div>
              <span className="rounded-full border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                {vehicle.plate ?? "Sin patente"}
              </span>
            </div>

            <div className="mt-5 min-w-0">
              <h2 className="truncate font-heading text-xl font-semibold">
                {vehicle.make} {vehicle.model}
              </h2>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                {vehicle.client.fullName}
              </p>
            </div>

            <div className="mt-5 rounded-[14px] bg-[#eef4ff] p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[#64748b]">VIN</p>
              <p className="mt-2 break-all text-sm font-semibold text-[#0b4ecb]">{vehicle.vin}</p>
            </div>

            <p className="mt-3 text-xs text-[color:var(--muted)]">
              Registrado el {formatDate(vehicle.createdAt)}
            </p>

            <div className="mt-auto flex flex-col gap-3 pt-5">
              <div className="rounded-xl border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium">
                {vehicle._count.workOrders} orden{vehicle._count.workOrders === 1 ? "" : "es"}
              </div>
              <div className="flex items-center justify-between gap-3">
                <MoveToTrashButton entityId={vehicle.id} entityType="vehicle" redirectTo="/vehicles" />
                <Link href={`/vehicles/${vehicle.id}`}>
                  <Button size="sm" variant="secondary">
                    Ver ficha
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {vehicles.length === 0 ? (
          <Card className="rounded-xl text-center md:col-span-2 2xl:col-span-3">
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
    <div className="rounded-xl border border-[#d7e0ec] bg-[#f8fbff] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 font-heading text-3xl font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
