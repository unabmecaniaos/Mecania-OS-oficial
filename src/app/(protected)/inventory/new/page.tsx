import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { RepuestoForm } from "@/app/(protected)/inventory/repuesto-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isValidVinFormat } from "@/lib/vin";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { getPartCompatibilityContext } from "@/modules/inventory/inventory.service";

export default async function NewInventoryPartPage() {
  const session = await getCurrentSession();

  if (session?.user.role !== UserRole.ADMIN) {
    redirect("/inventory");
  }

  const { vehicles } = await getPartCompatibilityContext();

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Alta rapida
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">Nuevo repuesto</h1>
          </div>

          <Link href="/inventory">
            <Button variant="secondary">Volver a inventario</Button>
          </Link>
        </div>
      </Card>

      <Card className="rounded-2xl">
        <RepuestoForm
          vehicles={vehicles
            .filter((vehicle) => isValidVinFormat(vehicle.vin))
            .map((vehicle) => ({
              id: vehicle.id,
              label: `${vehicle.make} ${vehicle.model} / ${vehicle.plate ?? vehicle.vin} / ${vehicle.client.fullName}`,
            }))}
        />
      </Card>
    </div>
  );
}
