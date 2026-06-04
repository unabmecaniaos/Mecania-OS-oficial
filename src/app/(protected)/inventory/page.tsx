import Link from "next/link";
import { UserRole } from "@prisma/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoveToTrashButton, SectionTrashLink } from "@/components/trash/trash-ui";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { listInventory } from "@/modules/inventory/inventory.service";

import { InventoryFilters } from "./inventory-filters";

type InventoryPageProps = {
  searchParams: Promise<{
    q?: string;
    lowStock?: string;
  }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const { q, lowStock } = await searchParams;
  const session = await getCurrentSession();
  const isAdmin = session?.user.role === UserRole.ADMIN;
  const repuestos = await listInventory({
    search: q,
    lowStock: lowStock === "1",
  });

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Repuestos y stock
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">Inventario</h1>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin ? (
                <>
                  <Link href="/inventory/new">
                    <Button className="min-w-[150px] whitespace-nowrap">Nuevo repuesto</Button>
                  </Link>
                  <Link href="/inventory/stock/new">
                    <Button className="min-w-[150px] whitespace-nowrap" variant="secondary">
                      Ajuste de stock
                    </Button>
                  </Link>
                  <Link href="/inventory/compatibility">
                    <Button className="min-w-[170px] whitespace-nowrap" variant="secondary">
                      Compatibilidad VIN
                    </Button>
                  </Link>
                </>
              ) : null}
              <Link href="/inventory/movements">
                <Button className="min-w-[190px] whitespace-nowrap" variant="secondary">
                  Movimientos recientes
                </Button>
              </Link>
            </div>

            <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <InventoryFilters
                key={`${q ?? ""}:${lowStock ?? ""}`}
                lowStock={lowStock}
                q={q}
              />

              {isAdmin ? (
                <div className="flex lg:justify-end">
                  <SectionTrashLink href="/inventory/trash" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {repuestos.map((repuesto) => (
          <Card className="rounded-xl px-5 py-4" key={repuesto.id}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate font-heading text-xl font-semibold">{repuesto.name}</h2>
                    {repuesto.isLowStock ? (
                      <span className="rounded-full border border-[#f59e0b]/30 bg-[#fff7ed] px-3 py-1 text-xs font-semibold text-[#9a3412]">
                        Stock bajo
                      </span>
                    ) : (
                      <span className="rounded-full border border-[#16a34a]/25 bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#166534]">
                        Disponible
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                    Codigo {repuesto.code}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {repuesto.compatibleVehicles.length > 0
                      ? `${repuesto.compatibleVehicles.length} vehiculo(s) compatible(s) por VIN`
                      : "Sin compatibilidad VIN registrada"}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-4">
                  <MiniStat label="Stock" value={String(repuesto.currentStock)} />
                  <MiniStat label="Minimo" value={String(repuesto.minimumStock)} />
                  <MiniStat
                    label="Precio"
                    value={`$${repuesto.unitPrice.toLocaleString("es-CL")}`}
                  />
                  <MiniStat
                    label="Valor"
                    value={`$${(repuesto.currentStock * repuesto.unitPrice).toLocaleString("es-CL")}`}
                  />
                </div>
              </div>
            </div>

            {isAdmin ? (
              <div className="mt-4 flex justify-end">
                <MoveToTrashButton
                  entityId={repuesto.id}
                  entityType="repuesto"
                  redirectTo="/inventory"
                />
              </div>
            ) : null}
          </Card>
        ))}

        {repuestos.length === 0 ? (
          <Card className="rounded-xl text-center">
            <p className="text-[color:var(--muted-strong)]">
              No hay repuestos con esos filtros.
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
      <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-1 font-heading text-base font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
