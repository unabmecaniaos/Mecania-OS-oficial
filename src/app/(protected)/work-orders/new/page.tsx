import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { listClients } from "@/modules/clients/client.service";
import { getInternalInsuranceCaseDetail } from "@/modules/insurance-cases/insurance-case.service";
import { getAssignableMechanics } from "@/modules/work-orders/work-order.service";
import { listVehicles } from "@/modules/vehicles/vehicle.service";
import { WorkOrderForm } from "@/app/(protected)/work-orders/work-order-form";

type NewWorkOrderPageProps = {
  searchParams: Promise<{
    clientId?: string;
    vehicleId?: string;
    insuranceCaseId?: string;
  }>;
};

export default async function NewWorkOrderPage({ searchParams }: NewWorkOrderPageProps) {
  const { clientId, vehicleId, insuranceCaseId } = await searchParams;
  const [clients, vehicles, mechanics, insuranceCase] = await Promise.all([
    listClients(),
    listVehicles(),
    getAssignableMechanics(),
    insuranceCaseId ? getInternalInsuranceCaseDetail(insuranceCaseId) : Promise.resolve(null),
  ]);
  const formClients = clients.map((client) => ({
    id: client.id,
    fullName: client.fullName,
  }));
  const formVehicles = vehicles.map((vehicle) => ({
    id: vehicle.id,
    clientId: vehicle.client.id,
    label: `${vehicle.client.fullName} / ${vehicle.make} ${vehicle.model} / ${vehicle.vin}`,
  }));
  const defaultClientId = insuranceCase?.clientId ?? clientId;
  const defaultVehicleId = insuranceCase?.vehicleId ?? vehicleId;

  if (insuranceCase && !formClients.some((client) => client.id === insuranceCase.clientId)) {
    formClients.push({
      id: insuranceCase.clientId,
      fullName: insuranceCase.ownerFullName,
    });
  }

  if (insuranceCase && !formVehicles.some((vehicle) => vehicle.id === insuranceCase.vehicleId)) {
    formVehicles.push({
      id: insuranceCase.vehicleId,
      clientId: insuranceCase.clientId,
      label: `${insuranceCase.ownerFullName} / ${insuranceCase.vehicle.make} ${insuranceCase.vehicle.model} / ${insuranceCase.vehicle.plate ?? insuranceCase.vehicle.vin}`,
    });
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Flujo operativo
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">Nueva orden de trabajo</h1>
          </div>

          <Link href="/work-orders">
            <Button variant="secondary">Volver al listado</Button>
          </Link>
        </div>
      </Card>

      <Card className="rounded-2xl">
        <WorkOrderForm
          clients={formClients}
          contextSummary={
            insuranceCase
              ? {
                  eyebrow: "Cliente liquidadora",
                  title: `${insuranceCase.ownerFullName} / ${insuranceCase.caseNumber}`,
                  details: [
                    `Liquidadora: ${insuranceCase.liquidator.name}`,
                    `Vehiculo: ${insuranceCase.vehicle.make} ${insuranceCase.vehicle.model} / ${insuranceCase.vehicle.plate ?? insuranceCase.vehicle.vin}`,
                    `Fecha del choque: ${formatDate(insuranceCase.incidentDate)}`,
                  ],
                }
              : undefined
          }
          defaultClientId={defaultClientId}
          defaultInitialDiagnosis={
            insuranceCase
              ? `Caso ${insuranceCase.caseNumber}. Danos reportados por liquidadora: ${insuranceCase.description}`
              : undefined
          }
          defaultReason={
            insuranceCase
              ? `Ingreso desde cliente liquidadora ${insuranceCase.caseNumber}: ${insuranceCase.description}`
              : undefined
          }
          defaultVehicleId={defaultVehicleId}
          lockClientVehicle={Boolean(insuranceCase)}
          mechanics={mechanics.map((mechanic) => ({
            id: mechanic.id,
            name: mechanic.name,
          }))}
          vehicles={formVehicles}
        />
      </Card>
    </div>
  );
}

