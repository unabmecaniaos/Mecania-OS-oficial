import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const withPlate = vehicles.filter((vehicle) => vehicle.plate).length;

  return (
    <div className="space-y-6">
      <Card className="rounded-[22px]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Registro vehicular
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-white">
              Vehiculos del taller
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted-strong)]">
              Fichas activas del parque vehicular, contexto del cliente y carga operativa acumulada.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-[520px]">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.6)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Vehiculos
                </p>
                <p className="mt-3 font-heading text-3xl font-semibold text-white">{vehicles.length}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.6)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Con patente
                </p>
                <p className="mt-3 font-heading text-3xl font-semibold text-white">{withPlate}</p>
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
                placeholder="Buscar por VIN, patente o cliente"
              />
              <Button type="submit" variant="secondary">
                Buscar
              </Button>
              <Link href="/vehicles/new">
                <Button>Nuevo vehiculo</Button>
              </Link>
            </form>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {vehicles.map((vehicle) => (
          <Card className="rounded-[20px] p-5" key={vehicle.id}>
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent)]">
                      Vehiculo
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold text-white">
                      {vehicle.make} {vehicle.model}
                    </h2>
                  </div>
                  <div className="rounded-full border border-[color:var(--border)] bg-[rgba(34,50,74,0.72)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-strong)]">
                    {vehicle.year}
                  </div>
                </div>
                <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                  {vehicle.client.fullName} / {vehicle.plate ?? "Sin patente"}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  VIN {vehicle.vin} / Registrado {formatDate(vehicle.createdAt)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.64)] px-4 py-4 text-sm text-[color:var(--muted-strong)]">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    Ordenes
                  </p>
                  <p className="mt-2 font-heading text-2xl font-semibold text-white">
                    {vehicle._count.workOrders}
                  </p>
                </div>
                <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.64)] px-4 py-4 text-sm text-[color:var(--muted-strong)]">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    Patente
                  </p>
                  <p className="mt-2 font-heading text-2xl font-semibold text-white">
                    {vehicle.plate ?? "--"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[color:var(--border)] pt-4">
                <div className="rounded-full border border-[rgba(76,195,255,0.22)] bg-[rgba(76,195,255,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--info)]">
                  Ficha tecnica
                </div>
                <Link
                  className="text-sm font-semibold text-[color:var(--accent)] hover:text-[color:var(--accent-strong)]"
                  href={`/vehicles/${vehicle.id}`}
                >
                  Ver ficha
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {vehicles.length === 0 ? (
          <Card className="rounded-[20px] p-8 text-center xl:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Sin resultados
            </p>
            <p className="mt-3 text-[color:var(--muted-strong)]">
              No hay vehiculos para mostrar con este filtro.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

