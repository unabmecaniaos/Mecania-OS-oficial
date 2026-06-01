import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole, VehiclePartCompatibilitySource } from "@prisma/client";

import { PartCompatibilityForm } from "@/app/(protected)/inventory/compatibility/part-compatibility-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { isValidVinFormat } from "@/lib/vin";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { getPartCompatibilityContext } from "@/modules/inventory/inventory.service";

const SOURCE_LABELS: Record<VehiclePartCompatibilitySource, string> = {
  [VehiclePartCompatibilitySource.MANUAL]: "Manual",
  [VehiclePartCompatibilitySource.WORK_ORDER]: "Orden de trabajo",
  [VehiclePartCompatibilitySource.IMPORT]: "Importacion",
};

export default async function InventoryCompatibilityPage() {
  const session = await getCurrentSession();

  if (session?.user.role !== UserRole.ADMIN) {
    redirect("/inventory");
  }

  const { repuestos, vehicles, compatibilities } = await getPartCompatibilityContext();
  const validVinVehicles = vehicles.filter((vehicle) => isValidVinFormat(vehicle.vin));

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Compatibilidad por VIN
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">
              Repuestos compatibles con vehiculos
            </h1>
          </div>

          <Link href="/inventory">
            <Button variant="secondary">Volver a inventario</Button>
          </Link>
        </div>
      </Card>

      <Card className="rounded-2xl">
        <PartCompatibilityForm
          repuestos={repuestos.map((repuesto) => ({
            id: repuesto.id,
            label: `${repuesto.name} / ${repuesto.code}`,
          }))}
          vehicles={validVinVehicles.map((vehicle) => ({
            id: vehicle.id,
            label: `${vehicle.make} ${vehicle.model} / VIN ${vehicle.vin} / ${vehicle.client.fullName}`,
          }))}
        />
      </Card>

      <div className="space-y-3">
        {compatibilities.map((compatibility) => (
          <Card className="rounded-xl px-5 py-4" key={compatibility.id}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold">
                  {compatibility.repuesto.name}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                  {compatibility.repuesto.code} / {compatibility.vehicle.make}{" "}
                  {compatibility.vehicle.model} / VIN {compatibility.vehicle.vin}
                </p>
                {compatibility.notes ? (
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {compatibility.notes}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <MiniStat label="Fuente" value={SOURCE_LABELS[compatibility.source]} />
                <MiniStat label="Registro" value={formatDate(compatibility.createdAt)} />
              </div>
            </div>
          </Card>
        ))}

        {compatibilities.length === 0 ? (
          <Card className="rounded-xl text-center">
            <p className="text-[color:var(--muted-strong)]">
              Aun no hay compatibilidades registradas.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-white/75 px-3 py-2 text-left">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-1 font-heading text-base font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
