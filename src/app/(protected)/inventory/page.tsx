import Link from "next/link";
import { UserRole } from "@prisma/client";

import { MoveToTrashButton, SectionTrashLink } from "@/components/trash/trash-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { listInventory } from "@/modules/inventory/inventory.service";

import { InventoryFilters } from "./inventory-filters";

type InventoryPageProps = {
  searchParams: Promise<{
    lowStock?: string;
    q?: string;
  }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const { q, lowStock } = await searchParams;
  const session = await getCurrentSession();
  const isAdmin = session?.user.role === UserRole.ADMIN;
  const repuestos = await listInventory({
    lowStock: lowStock === "1",
    search: q,
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">
            Inventario
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Controla repuestos, stock disponible y compatibilidades por VIN.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
          {isAdmin ? (
            <>
              <Link href="/inventory/new">
                <Button className="w-full whitespace-nowrap sm:w-auto">Nuevo repuesto</Button>
              </Link>
              <Link href="/inventory/stock/new">
                <Button className="w-full whitespace-nowrap sm:w-auto" variant="secondary">
                  Ajuste de stock
                </Button>
              </Link>
              <Link href="/inventory/compatibility">
                <Button className="w-full whitespace-nowrap sm:w-auto" variant="secondary">
                  Compatibilidad VIN
                </Button>
              </Link>
            </>
          ) : null}
          <Link href="/inventory/movements">
            <Button className="w-full whitespace-nowrap sm:w-auto" variant="secondary">
              Movimientos
            </Button>
          </Link>
        </div>
      </section>

      <Card className="rounded-[22px] bg-white">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <InventoryFilters key={`${q ?? ""}:${lowStock ?? ""}`} lowStock={lowStock} q={q} />

          {isAdmin ? (
            <div className="flex lg:justify-end">
              <SectionTrashLink href="/inventory/trash" />
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <HeroStat label="Repuestos visibles" value={repuestos.length} />
        <HeroStat
          label="Stock total"
          value={repuestos.reduce((sum, repuesto) => sum + repuesto.currentStock, 0)}
        />
        <HeroStat
          label="Stock bajo"
          value={repuestos.filter((repuesto) => repuesto.isLowStock).length}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {repuestos.map((repuesto) => (
          <Card className="flex min-h-[286px] flex-col rounded-[22px] bg-white p-5" key={repuesto.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#eef4ff] text-sm font-bold text-[#1d4ed8]">
                RP
              </div>
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

            <div className="mt-5 min-w-0">
              <h2 className="truncate font-heading text-xl font-semibold">{repuesto.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Codigo {repuesto.code}
              </p>
            </div>

            <div className="mt-5 rounded-[14px] bg-[#eef4ff] p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[#64748b]">
                Compatibilidad VIN
              </p>
              <p className="mt-2 text-sm font-semibold text-[#0b4ecb]">
                {repuesto.compatibleVehicles.length > 0
                  ? `${repuesto.compatibleVehicles.length} vehiculo(s) compatible(s)`
                  : "Sin compatibilidad registrada"}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniStat label="Stock" value={String(repuesto.currentStock)} />
              <MiniStat label="Minimo" value={String(repuesto.minimumStock)} />
              <MiniStat label="Precio" value={`$${repuesto.unitPrice.toLocaleString("es-CL")}`} />
              <MiniStat
                label="Valor"
                value={`$${(repuesto.currentStock * repuesto.unitPrice).toLocaleString("es-CL")}`}
              />
            </div>

            {isAdmin ? (
              <div className="mt-auto flex justify-end pt-5">
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
          <Card className="rounded-xl text-center md:col-span-2 2xl:col-span-3">
            <p className="text-[color:var(--muted-strong)]">No hay repuestos con esos filtros.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-xl bg-[#f8fbff] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-left">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-1 font-heading text-base font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
