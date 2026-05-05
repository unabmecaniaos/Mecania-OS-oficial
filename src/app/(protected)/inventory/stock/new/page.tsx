import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { StockAdjustmentForm } from "@/app/(protected)/inventory/stock-adjustment-form";
import { StockEntryForm } from "@/app/(protected)/inventory/stock-entry-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { listInventoryOptions } from "@/modules/inventory/inventory.service";

export default async function NewInventoryStockPage() {
  const session = await getCurrentSession();

  if (session?.user.role !== UserRole.ADMIN) {
    redirect("/inventory");
  }

  const repuestos = await listInventoryOptions();

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Movimiento de inventario
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">Ajuste de stock</h1>
          </div>

          <Link href="/inventory">
            <Button variant="secondary">Volver a inventario</Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Sumar stock
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">Ingreso de stock</h2>

          <div className="mt-6">
            <StockEntryForm repuestos={repuestos} />
          </div>
        </Card>

        <Card className="rounded-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Corregir stock
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">Ajuste manual</h2>

          <div className="mt-6">
            <StockAdjustmentForm repuestos={repuestos} />
          </div>
        </Card>
      </div>
    </div>
  );
}
