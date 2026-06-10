import Link from "next/link";

import {
  LiquidatorClientCard,
  WorkshopClientCard,
} from "@/components/clients/client-cards";
import { SectionTrashLink } from "@/components/trash/trash-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { listClients } from "@/modules/clients/client.service";
import { listInternalInsuranceCases } from "@/modules/insurance-cases/insurance-case.service";

type ClientTypeFilter = "all" | "workshop" | "liquidator";
type ClientSort = "newest" | "oldest" | "alpha" | "activity";

type ClientsPageProps = {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    type?: string;
  }>;
};

const TYPE_FILTERS: Array<{ value: ClientTypeFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "workshop", label: "Taller" },
  { value: "liquidator", label: "Liquidadora" },
];

function resolveType(value?: string): ClientTypeFilter {
  if (value === "workshop" || value === "liquidator") {
    return value;
  }

  return "all";
}

function resolveSort(value?: string): ClientSort {
  if (value === "oldest" || value === "alpha" || value === "activity") {
    return value;
  }

  return "newest";
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { q, sort, type } = await searchParams;
  const currentType = resolveType(type);
  const currentSort = resolveSort(sort);
  const [workshopClients, liquidatorClients] = await Promise.all([
    listClients(q),
    listInternalInsuranceCases(q),
  ]);

  const entries = [
    ...workshopClients.map((client) => ({
      activity: client._count.vehicles + client._count.workOrders,
      client,
      createdAt: client.createdAt,
      id: client.id,
      kind: "workshop" as const,
      name: client.fullName,
    })),
    ...liquidatorClients.map((insuranceCase) => ({
      activity: Number(Boolean(insuranceCase.latestBudget)) + Number(Boolean(insuranceCase.currentWorkOrder)),
      createdAt: insuranceCase.createdAt,
      id: insuranceCase.id,
      insuranceCase,
      kind: "liquidator" as const,
      name: insuranceCase.ownerFullName,
    })),
  ]
    .filter((entry) => currentType === "all" || entry.kind === currentType)
    .sort((a, b) => {
      if (currentSort === "alpha") {
        return a.name.localeCompare(b.name, "es");
      }

      if (currentSort === "activity") {
        return b.activity - a.activity || b.createdAt.getTime() - a.createdAt.getTime();
      }

      if (currentSort === "oldest") {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const totalVehicles = workshopClients.reduce((sum, client) => sum + client._count.vehicles, 0);
  const totalOrders = workshopClients.reduce((sum, client) => sum + client._count.workOrders, 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">
            Todos los clientes
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Administra clientes taller y clientes liquidadora desde una sola vista.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/clients/new">
            <Button className="w-full sm:w-auto">Nuevo cliente</Button>
          </Link>
          <SectionTrashLink href="/clients/trash" />
        </div>
      </section>

      <Card className="rounded-[22px] bg-white">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
          <form className="grid gap-4 lg:grid-cols-[1fr_170px_220px_auto]" method="get">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Buscar
              </label>
              <Input defaultValue={q} name="q" placeholder="Nombre, correo, telefono, empresa o patente" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Tipo
              </label>
              <Select defaultValue={currentType} name="type">
                <option value="all">Todos</option>
                <option value="workshop">Clientes taller</option>
                <option value="liquidator">Clientes liquidadora</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Ordenar
              </label>
              <Select defaultValue={currentSort} name="sort">
                <option value="newest">Mas recientes</option>
                <option value="oldest">Mas antiguos</option>
                <option value="alpha">Alfabeticamente</option>
                <option value="activity">Mas actividad</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full lg:w-auto" type="submit" variant="secondary">
                Aplicar
              </Button>
            </div>
          </form>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[430px]">
            <HeroStat label="Resultados" value={entries.length} />
            <HeroStat label="Taller" value={workshopClients.length} />
            <HeroStat label="Liquidadora" value={liquidatorClients.length} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((item) => (
            <Link
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                currentType === item.value
                  ? "border-[#0f172a] bg-[#0f172a] !text-[#ffffff] shadow-[0_10px_24px_rgba(15,23,42,0.14)] hover:!text-[#ffffff]"
                  : "border-[color:var(--border)] bg-white/75 text-[color:var(--muted-strong)] hover:border-[rgba(37,99,235,0.20)] hover:text-[#1d4ed8]",
              )}
              href={`/clients?type=${item.value}&sort=${currentSort}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              key={item.value}
            >
              {item.label}
            </Link>
          ))}
          <span className="rounded-full border border-[#d7e0ec] bg-white px-3.5 py-2 text-sm text-[color:var(--muted-strong)]">
            {totalVehicles} vehiculos / {totalOrders} ordenes taller
          </span>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {entries.map((entry) =>
          entry.kind === "workshop" ? (
            <WorkshopClientCard
              client={entry.client}
              key={entry.id}
              mode="clients"
              showTrash
              trashRedirectTo="/clients"
            />
          ) : (
            <LiquidatorClientCard insuranceCase={entry.insuranceCase} key={entry.id} mode="clients" />
          ),
        )}
      </div>

      {entries.length === 0 ? (
        <Card className="rounded-xl text-center">
          <p className="text-[color:var(--muted-strong)]">
            No hay clientes que coincidan con los filtros seleccionados.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#d7e0ec] bg-[#f8fbff] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
