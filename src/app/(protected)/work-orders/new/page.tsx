import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listClients } from "@/modules/clients/client.service";
import { listVehicles } from "@/modules/vehicles/vehicle.service";
import { WorkOrderForm } from "@/app/(protected)/work-orders/work-order-form";

type NewWorkOrderPageProps = {
  searchParams: Promise<{
    clientId?: string;
    vehicleId?: string;
  }>;
};

export default async function NewWorkOrderPage({ searchParams }: NewWorkOrderPageProps) {
  const { clientId, vehicleId } = await searchParams;
  const [clients, vehicles] = await Promise.all([listClients(), listVehicles()]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <Card className="rounded-[22px]">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Flujo operativo
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-white">
            Nueva orden de trabajo
          </h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
            Inicia una OT con contexto completo de cliente, vehiculo, motivo y diagnostico inicial.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-[18px] border border-[rgba(55,168,255,0.22)] bg-[rgba(55,168,255,0.08)] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Flujo sugerido
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted-strong)]">
              Selecciona cliente y vehiculo, registra motivo, luego fija estado y fecha estimada.
            </p>
          </div>

          <Link href="/work-orders">
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
          <h2 className="mt-2 font-heading text-2xl font-semibold text-white">
            Apertura de orden
          </h2>
        </div>
        <WorkOrderForm
          clients={clients.map((client) => ({
            id: client.id,
            fullName: client.fullName,
          }))}
          defaultClientId={clientId}
          defaultVehicleId={vehicleId}
          vehicles={vehicles.map((vehicle) => ({
            id: vehicle.id,
            label: `${vehicle.client.fullName} / ${vehicle.make} ${vehicle.model} / ${vehicle.vin}`,
          }))}
        />
      </Card>
    </div>
  );
}

