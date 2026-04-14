import Link from "next/link";

import { QuoteForm } from "@/app/(protected)/quotes/quote-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listClients } from "@/modules/clients/client.service";
import { listQuoteEligibleSelfInspections } from "@/modules/quotes/quote.service";
import { listVehicles } from "@/modules/vehicles/vehicle.service";

export default async function NewQuotePage() {
  const [clients, vehicles, reviewedInspections] = await Promise.all([
    listClients(),
    listVehicles(),
    listQuoteEligibleSelfInspections(),
  ]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Flujo de presupuestos
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">Nuevo presupuesto</h1>
          </div>

          <Link href="/quotes">
            <Button variant="secondary">Volver al listado</Button>
          </Link>
        </div>
      </Card>

      <Card className="rounded-2xl">
        <QuoteForm
          clients={clients.map((client) => ({
            id: client.id,
            fullName: client.fullName,
          }))}
          reviewedInspections={reviewedInspections.map((inspection) => ({
            id: inspection.id,
            clientId: inspection.customerId,
            vehicleId: inspection.vehicleId,
            label: `${inspection.customer.fullName} / ${
              inspection.vehicleSnapshot?.make ?? inspection.vehicle?.make ?? "Vehiculo"
            } ${inspection.vehicleSnapshot?.model ?? inspection.vehicle?.model ?? ""} / ${
              inspection.vehicleSnapshot?.plate ?? inspection.vehicle?.plate ?? "Sin patente"
            }`,
          }))}
          vehicles={vehicles.map((vehicle) => ({
            id: vehicle.id,
            clientId: vehicle.client.id,
            label: `${vehicle.client.fullName} / ${vehicle.make} ${vehicle.model} / ${
              vehicle.plate ?? vehicle.vin
            }`,
          }))}
        />
      </Card>
    </div>
  );
}
