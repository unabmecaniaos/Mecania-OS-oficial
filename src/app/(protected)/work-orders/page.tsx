import Link from "next/link";
import { WorkOrderServiceFlow } from "@prisma/client";

import { AutoSubmitFilterForm } from "@/app/(protected)/work-orders/auto-submit-filter-form";
import {
  LiquidatorClientCard,
  WorkshopClientCard,
} from "@/components/clients/client-cards";
import { SectionTrashLink } from "@/components/trash/trash-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listClients } from "@/modules/clients/client.service";
import { listInternalInsuranceCases } from "@/modules/insurance-cases/insurance-case.service";
import { WORK_ORDER_SERVICE_FLOW_SHORT_LABELS } from "@/modules/work-orders/work-order.constants";

type WorkOrdersView = "workshop-clients" | "liquidator-clients";
type FlowFilter = "all" | "mechanics" | "paint" | "mixed";

type WorkOrdersPageProps = {
  searchParams: Promise<{
    flow?: string;
    q?: string;
    view?: string;
  }>;
};

const WORK_ORDER_VIEWS: Array<{ value: WorkOrdersView; label: string }> = [
  { value: "workshop-clients", label: "Clientes taller" },
  { value: "liquidator-clients", label: "Clientes liquidadora" },
];

const FLOW_FILTERS: Array<{ value: FlowFilter; label: string; flow?: WorkOrderServiceFlow }> = [
  { value: "all", label: "Todos" },
  { value: "mechanics", label: "Mecanica", flow: WorkOrderServiceFlow.MECHANICS },
  { value: "paint", label: "Pintura", flow: WorkOrderServiceFlow.PAINT },
  { value: "mixed", label: "Mixto", flow: WorkOrderServiceFlow.MECHANICS_AND_PAINT },
];

function resolveView(value?: string): WorkOrdersView {
  if (value === "liquidator-clients") {
    return "liquidator-clients";
  }

  return "workshop-clients";
}

function resolveFlowFilter(value?: string): FlowFilter {
  if (value === "mechanics" || value === "paint" || value === "mixed") {
    return value;
  }

  return "all";
}

function flowFilterToServiceFlow(value: FlowFilter) {
  return FLOW_FILTERS.find((filter) => filter.value === value)?.flow;
}

function getFlowTone(flow?: WorkOrderServiceFlow | null) {
  if (flow === WorkOrderServiceFlow.PAINT) {
    return "paint";
  }

  if (flow === WorkOrderServiceFlow.MECHANICS_AND_PAINT) {
    return "mixed";
  }

  if (flow === WorkOrderServiceFlow.MECHANICS) {
    return "mechanics";
  }

  return "none";
}

function FlowBadge({ flow }: { flow?: WorkOrderServiceFlow | null }) {
  const tone = getFlowTone(flow);

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold",
        tone === "mechanics" && "border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.08)] text-[#1d4ed8]",
        tone === "paint" && "border-[rgba(200,92,42,0.20)] bg-[rgba(200,92,42,0.10)] text-[color:var(--accent-strong)]",
        tone === "mixed" && "border-[rgba(15,23,42,0.14)] bg-[rgba(15,23,42,0.06)] text-[color:var(--foreground)]",
        tone === "none" && "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--muted-strong)]",
      )}
    >
      {flow ? WORK_ORDER_SERVICE_FLOW_SHORT_LABELS[flow] : "Sin orden activa"}
    </span>
  );
}

function getWorkshopClientFlow(client: Awaited<ReturnType<typeof listClients>>[number]) {
  return client.workOrders[0]?.serviceFlow ?? null;
}

function getLiquidatorClientFlow(
  insuranceCase: Awaited<ReturnType<typeof listInternalInsuranceCases>>[number],
) {
  return insuranceCase.currentWorkOrder?.serviceFlow ?? null;
}

function buildFlowCounts<T>(
  records: T[],
  getFlow: (record: T) => WorkOrderServiceFlow | null | undefined,
) {
  return {
    all: records.length,
    mechanics: records.filter((record) => getFlow(record) === WorkOrderServiceFlow.MECHANICS).length,
    paint: records.filter((record) => getFlow(record) === WorkOrderServiceFlow.PAINT).length,
    mixed: records.filter((record) => getFlow(record) === WorkOrderServiceFlow.MECHANICS_AND_PAINT).length,
  } satisfies Record<FlowFilter, number>;
}

function filterByFlow<T>(
  records: T[],
  flowFilter: FlowFilter,
  getFlow: (record: T) => WorkOrderServiceFlow | null | undefined,
) {
  const serviceFlow = flowFilterToServiceFlow(flowFilter);

  if (!serviceFlow) {
    return records;
  }

  return records.filter((record) => getFlow(record) === serviceFlow);
}

export default async function WorkOrdersPage({ searchParams }: WorkOrdersPageProps) {
  const { flow, q, view } = await searchParams;
  const currentView = resolveView(view);
  const currentFlow = resolveFlowFilter(flow);

  const allWorkshopClients = currentView === "workshop-clients" ? await listClients(q) : [];
  const allLiquidatorClients =
    currentView === "liquidator-clients" ? await listInternalInsuranceCases(q) : [];
  const flowCounts =
    currentView === "workshop-clients"
      ? buildFlowCounts(allWorkshopClients, getWorkshopClientFlow)
      : buildFlowCounts(allLiquidatorClients, getLiquidatorClientFlow);
  const workshopClients = filterByFlow(
    allWorkshopClients,
    currentFlow,
    getWorkshopClientFlow,
  );
  const liquidatorClients = filterByFlow(
    allLiquidatorClients,
    currentFlow,
    getLiquidatorClientFlow,
  );

  const totalWorkshopVehicles = workshopClients.reduce(
    (sum, client) => sum + client._count.vehicles,
    0,
  );
  const totalWorkshopOrders = workshopClients.reduce(
    (sum, client) => sum + client._count.workOrders,
    0,
  );
  const liquidatorBudgetsPending = liquidatorClients.filter(
    (insuranceCase) => insuranceCase.hasPendingBudgetDecision,
  ).length;
  const liquidatorCasesWithoutBudget = liquidatorClients.filter(
    (insuranceCase) => !insuranceCase.latestBudget,
  ).length;
  const liquidatorCasesInRepair = liquidatorClients.filter(
    (insuranceCase) => insuranceCase.currentWorkOrder,
  ).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">
            Ordenes
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Gestiona clientes taller, clientes liquidadora y el flujo operativo de las OT.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {currentView === "workshop-clients" ? (
            <>
              <HeroStat label="Clientes visibles" value={workshopClients.length} />
              <HeroStat label="Vehiculos ligados" value={totalWorkshopVehicles} />
              <HeroStat label="Ordenes ligadas" value={totalWorkshopOrders} />
            </>
          ) : null}
          {currentView === "liquidator-clients" ? (
            <>
              <HeroStat label="Casos liquidadora" value={liquidatorClients.length} />
              <HeroStat label="Sin presupuesto" value={liquidatorCasesWithoutBudget} />
              <HeroStat label="En reparacion" value={liquidatorCasesInRepair} />
            </>
          ) : null}
        </div>
      </section>

      <Card className="overflow-hidden rounded-[22px] bg-white">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {WORK_ORDER_VIEWS.map((item) => (
              <Link
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                  currentView === item.value
                    ? "border-[rgba(37,99,235,0.22)] bg-[linear-gradient(180deg,rgba(37,99,235,0.18),rgba(37,99,235,0.10))] text-[#1d4ed8] shadow-[0_10px_24px_rgba(37,99,235,0.10)]"
                    : "border-transparent bg-transparent text-[color:var(--muted-strong)] hover:border-[rgba(37,99,235,0.12)] hover:bg-[rgba(37,99,235,0.08)] hover:text-[#1d4ed8]",
                )}
                href={`/work-orders?view=${item.value}&flow=${currentFlow}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                key={item.value}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {FLOW_FILTERS.map((item) => (
              <Link
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                  currentFlow === item.value
                    ? "border-[#0f172a] bg-[#0f172a] !text-[#ffffff] shadow-[0_10px_24px_rgba(15,23,42,0.14)] hover:!text-[#ffffff]"
                    : "border-[color:var(--border)] bg-white/75 text-[color:var(--muted-strong)] hover:border-[rgba(37,99,235,0.20)] hover:text-[#1d4ed8]",
                )}
                href={`/work-orders?view=${currentView}&flow=${item.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                key={item.value}
              >
                {item.label} ({flowCounts[item.value]})
              </Link>
            ))}
          </div>

          {currentView === "workshop-clients" ? (
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <AutoSubmitFilterForm
                className="flex flex-col gap-3 sm:flex-row xl:min-w-[520px]"
                method="get"
              >
                <input name="view" type="hidden" value={currentView} />
                <input name="flow" type="hidden" value={currentFlow} />
                <Input
                  defaultValue={q}
                  name="q"
                  placeholder="Buscar por nombre, correo o telefono"
                />
              </AutoSubmitFilterForm>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/work-orders/new">
                  <Button className="w-full sm:w-auto">Nueva orden</Button>
                </Link>
                <SectionTrashLink href="/clients/trash" />
              </div>
            </div>
          ) : null}

          {currentView === "liquidator-clients" ? (
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <AutoSubmitFilterForm
                className="flex flex-col gap-3 sm:flex-row xl:min-w-[520px]"
                method="get"
              >
                <input name="view" type="hidden" value={currentView} />
                <input name="flow" type="hidden" value={currentFlow} />
                <Input
                  defaultValue={q}
                  name="q"
                  placeholder="Buscar por titular, liquidadora, patente, VIN o caso"
                />
              </AutoSubmitFilterForm>

              <div className="rounded-xl border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.06)] px-4 py-3 text-sm text-[#1d4ed8]">
                Presupuestos pendientes: {liquidatorBudgetsPending}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {currentView === "workshop-clients" ? (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {workshopClients.map((client) => (
            <WorkshopClientCard
              badge={<FlowBadge flow={getWorkshopClientFlow(client)} />}
              client={client}
              key={client.id}
              mode="work-orders"
              showTrash
              trashRedirectTo="/work-orders?view=workshop-clients"
            />
          ))}

          {workshopClients.length === 0 ? (
            <Card className="rounded-xl text-center">
              <p className="text-[color:var(--muted-strong)]">
                No hay clientes del taller que coincidan con la busqueda.
              </p>
            </Card>
          ) : null}
        </div>
      ) : null}

      {currentView === "liquidator-clients" ? (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {liquidatorClients.map((insuranceCase) => (
            <LiquidatorClientCard
              badge={<FlowBadge flow={getLiquidatorClientFlow(insuranceCase)} />}
              insuranceCase={insuranceCase}
              key={insuranceCase.id}
              mode="work-orders"
            />
          ))}

          {liquidatorClients.length === 0 ? (
            <Card className="rounded-xl text-center lg:col-span-2">
              <p className="text-[color:var(--muted-strong)]">
                No hay clientes de liquidadora que coincidan con la busqueda.
              </p>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[rgba(37,99,235,0.12)] bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(37,99,235,0.06)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 font-heading text-3xl font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
