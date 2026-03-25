import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listClients } from "@/modules/clients/client.service";
import { VehicleForm } from "@/app/(protected)/vehicles/vehicle-form";

type NewVehiclePageProps = {
  searchParams: Promise<{
    clientId?: string;
  }>;
};

export default async function NewVehiclePage({ searchParams }: NewVehiclePageProps) {
  const { clientId } = await searchParams;
  const clients = await listClients();

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="rounded-[22px]">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Alta rapida
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-white">
            Registrar vehiculo
          </h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
            Vincula el vehiculo al cliente correcto y deja lista la ficha para nuevas ordenes.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[rgba(34,50,74,0.64)] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Consejo
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
              Prioriza VIN, marca y modelo. Son los datos clave para trazabilidad tecnica.
            </p>
          </div>

          <Link href="/vehicles">
            <Button className="w-full" variant="secondary">
              Volver al listado
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="rounded-[22px]">
        <div className="mb-6 border-b border-[color:var(--border)] pb-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent)]">
            Formulario
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-white">Ficha vehicular</h2>
        </div>
        <VehicleForm
          clients={clients.map((client) => ({
            id: client.id,
            fullName: client.fullName,
          }))}
          defaultClientId={clientId}
        />
      </Card>
    </div>
  );
}

