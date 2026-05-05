import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoveToTrashButton, SectionTrashLink } from "@/components/trash/trash-ui";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { BudgetStatusBadge } from "@/modules/budgets/budget-status-badge";
import { listBudgets } from "@/modules/budgets/budget.service";
import { listClients } from "@/modules/clients/client.service";
import { listInternalInsuranceCases } from "@/modules/insurance-cases/insurance-case.service";
import { StatusBadge } from "@/components/ui/status-badge";

type BudgetView = "budgets" | "workshop-clients" | "liquidator-clients";

type BudgetsPageProps = {
  searchParams: Promise<{
    q?: string;
    view?: string;
  }>;
};

const BUDGET_VIEWS: Array<{ value: BudgetView; label: string }> = [
  { value: "budgets", label: "Presupuestos" },
  { value: "workshop-clients", label: "Clientes taller" },
  { value: "liquidator-clients", label: "Clientes liquidadora" },
];

function resolveView(value?: string): BudgetView {
  if (value === "workshop-clients" || value === "liquidator-clients") {
    return value;
  }

  return "budgets";
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const { q, view } = await searchParams;
  const currentView = resolveView(view);
  const budgetData = currentView === "budgets" ? await listBudgets(q) : null;
  const workshopClients = currentView === "workshop-clients" ? await listClients(q) : [];
  const liquidatorClients =
    currentView === "liquidator-clients" ? await listInternalInsuranceCases(q) : [];

  const budgets = budgetData?.budgets ?? [];
  const summary = budgetData?.summary ?? {
    total: 0,
    drafts: 0,
    sent: 0,
    approved: 0,
  };
  const totalWorkshopVehicles = workshopClients.reduce(
    (sum, client) => sum + client._count.vehicles,
    0,
  );
  const totalWorkshopOrders = workshopClients.reduce(
    (sum, client) => sum + client._count.workOrders,
    0,
  );
  const liquidatorWithBudget = liquidatorClients.filter((item) => item.latestBudget).length;
  const liquidatorPendingBudget = liquidatorClients.filter((item) => !item.latestBudget).length;
  const liquidatorApproved = liquidatorClients.filter(
    (item) =>
      item.latestBudget?.status === "APPROVED" ||
      item.latestBudget?.status === "PARTIALLY_APPROVED" ||
      item.latestBudget?.status === "CONVERTED_TO_WORK_ORDER",
  ).length;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(239,246,255,0.94)_100%)]">
        <div className="space-y-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Presupuestos y clientes
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold">Presupuestos del taller</h1>
            </div>

            {currentView === "budgets" ? (
              <div className="grid gap-3 sm:grid-cols-4">
                <SummaryStat label="Total" tone="default" value={summary.total} />
                <SummaryStat label="Borradores" tone="info" value={summary.drafts} />
                <SummaryStat label="Enviados" tone="primary" value={summary.sent} />
                <SummaryStat label="Aprobados" tone="success" value={summary.approved} />
              </div>
            ) : null}
            {currentView === "workshop-clients" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryStat label="Clientes visibles" tone="default" value={workshopClients.length} />
                <SummaryStat label="Vehiculos ligados" tone="info" value={totalWorkshopVehicles} />
                <SummaryStat label="Ordenes ligadas" tone="primary" value={totalWorkshopOrders} />
              </div>
            ) : null}
            {currentView === "liquidator-clients" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryStat label="Casos liquidadora" tone="default" value={liquidatorClients.length} />
                <SummaryStat label="Con presupuesto" tone="info" value={liquidatorWithBudget} />
                <SummaryStat label="Aprobados" tone="success" value={liquidatorApproved} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {BUDGET_VIEWS.map((item) => (
              <Link
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                  currentView === item.value
                    ? "border-[rgba(37,99,235,0.22)] bg-[linear-gradient(180deg,rgba(37,99,235,0.18),rgba(37,99,235,0.10))] text-[#1d4ed8] shadow-[0_10px_24px_rgba(37,99,235,0.10)]"
                    : "border-transparent bg-transparent text-[color:var(--muted-strong)] hover:border-[rgba(37,99,235,0.12)] hover:bg-[rgba(37,99,235,0.08)] hover:text-[#1d4ed8]",
                )}
                href={`/budgets?view=${item.value}`}
                key={item.value}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <form className="flex flex-col gap-3 sm:flex-row xl:min-w-[520px]" method="get">
              <input name="view" type="hidden" value={currentView} />
              <Input
                defaultValue={q}
                name="q"
                placeholder={
                  currentView === "budgets"
                    ? "Buscar por numero, cliente o vehiculo"
                    : currentView === "workshop-clients"
                      ? "Buscar por nombre, correo o telefono"
                      : "Buscar por titular, liquidadora, patente o caso"
                }
              />
              <Button className="sm:min-w-[120px]" type="submit" variant="secondary">
                Buscar
              </Button>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {currentView === "budgets" ? (
                <Link href="/budgets/new?kind=workshop">
                  <Button className="w-full sm:w-auto">Nuevo presupuesto</Button>
                </Link>
              ) : null}
              {currentView === "workshop-clients" ? (
                <Link href="/budgets/new?kind=workshop">
                  <Button className="w-full sm:w-auto">Nuevo presupuesto taller</Button>
                </Link>
              ) : null}
              {currentView === "liquidator-clients" ? (
                <Link href="/budgets/new?kind=liquidator">
                  <Button className="w-full sm:w-auto">Nuevo presupuesto liquidadora</Button>
                </Link>
              ) : null}
              {currentView === "budgets" ? <SectionTrashLink href="/budgets/trash" /> : null}
            </div>
          </div>
        </div>
      </Card>

      {currentView === "budgets" ? (
        <div className="space-y-3">
          {budgets.map((budget) => (
            <Card className="rounded-xl px-5 py-4" key={budget.id}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="truncate font-heading text-xl font-semibold">{budget.title}</h2>
                      <span className="text-sm text-[color:var(--muted)]">{budget.budgetNumber}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-[color:var(--muted-strong)]">{budget.client.fullName}</p>
                      <BudgetStatusBadge status={budget.status} />
                    </div>
                    <p className="text-sm text-[color:var(--muted)]">
                      {budget.vehicle.make} {budget.vehicle.model} / {budget.vehicle.plate ?? budget.vehicle.vin} /{" "}
                      Creado {formatDate(budget.createdAt)}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniBudgetStat
                      label="Repuestos"
                      tone="danger"
                      value={formatCurrency(budget.subtotalParts)}
                    />
                    <MiniBudgetStat
                      label="Mano de obra"
                      tone="primary"
                      value={formatCurrency(budget.subtotalLabor)}
                    />
                    <MiniBudgetStat label="Items" tone="default" value={String(budget.items.length)} />
                    <MiniBudgetStat
                      label="Total"
                      tone="default"
                      value={formatCurrency(budget.totalAmount)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <MoveToTrashButton entityId={budget.id} entityType="budget" redirectTo="/budgets" />
                  <div className="flex flex-wrap justify-end gap-3">
                    <Link
                      className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                      href={`/budgets/${budget.id}`}
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {budgets.length === 0 ? (
            <Card className="rounded-xl text-center">
              <p className="text-[color:var(--muted-strong)]">
                No hay presupuestos para mostrar con este filtro.
              </p>
            </Card>
          ) : null}
        </div>
      ) : null}

      {currentView === "workshop-clients" ? (
        <div className="space-y-4">
          {workshopClients.map((client) => (
            <Card className="rounded-xl" key={client.id}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-heading text-2xl font-semibold">{client.fullName}</h2>
                    <span className="rounded-full border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                      Cliente taller
                    </span>
                  </div>
                  <p className="text-sm text-[color:var(--muted-strong)]">
                    {client.phone} / {client.email}
                  </p>
                  <p className="text-sm text-[color:var(--muted)]">
                    Creado el {formatDate(client.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-medium">
                    {client._count.vehicles} vehiculos
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-medium">
                    {client._count.workOrders} ordenes
                  </div>
                  <Link
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                    href={`/budgets/new?kind=workshop&clientId=${client.id}`}
                  >
                    Crear presupuesto taller
                  </Link>
                </div>
              </div>
            </Card>
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
        <div className="grid gap-4 lg:grid-cols-2">
          {liquidatorClients.map((insuranceCase) => (
            <Card className="rounded-2xl" key={insuranceCase.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {insuranceCase.caseNumber}
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold">
                    {insuranceCase.ownerFullName}
                  </h2>
                  <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                    Liquidadora: {insuranceCase.liquidator.name}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {insuranceCase.vehicle.make} {insuranceCase.vehicle.model} /{" "}
                    {insuranceCase.vehicle.plate ?? insuranceCase.vehicle.vin}
                  </p>
                </div>
                <span className="rounded-full border border-[rgba(37,99,235,0.16)] bg-[rgba(37,99,235,0.08)] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                  {insuranceCase.stageLabel}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Choque
                  </p>
                  <p className="mt-2 font-semibold">{formatDate(insuranceCase.incidentDate)}</p>
                </div>
                <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Presupuesto
                  </p>
                  <div className="mt-2">
                    {insuranceCase.latestBudget ? (
                      <BudgetStatusBadge status={insuranceCase.latestBudget.status} />
                    ) : (
                      <span className="text-sm text-[color:var(--muted)]">Pendiente</span>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    OT
                  </p>
                  <div className="mt-2">
                    {insuranceCase.currentWorkOrder ? (
                      <StatusBadge status={insuranceCase.currentWorkOrder.status} />
                    ) : (
                      <span className="text-sm text-[color:var(--muted)]">Aun no creada</span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-[color:var(--muted)]">
                {insuranceCase.latestBudget
                  ? `Monto actual: ${formatCurrency(insuranceCase.latestBudget.totalAmount)}`
                  : liquidatorPendingBudget > 0
                    ? "Todavia no existe un presupuesto conectado a este cliente de liquidadora."
                    : "Sin presupuesto asociado."}
              </p>

              <div className="mt-6 flex flex-wrap justify-end gap-4">
                <Link
                  className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                  href={`/budgets/new?kind=liquidator&insuranceCaseId=${insuranceCase.id}`}
                >
                  {insuranceCase.latestBudget ? "Crear nueva version" : "Crear presupuesto liquidadora"}
                </Link>
                {insuranceCase.latestBudget ? (
                  <Link
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                    href={`/budgets/${insuranceCase.latestBudget.id}`}
                  >
                    Ver presupuesto actual
                  </Link>
                ) : null}
              </div>
            </Card>
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

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "info" | "primary" | "success";
}) {
  const toneClass =
    tone === "info"
      ? "text-[#1d4ed8]"
      : tone === "primary"
        ? "text-[#1e3a8a]"
        : tone === "success"
          ? "text-[#0f766e]"
          : "text-[color:var(--foreground)]";

  return (
    <Card className="rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,250,254,0.96))] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">{label}</p>
      <p className={`mt-2 font-heading text-3xl font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}

function MiniBudgetStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "danger" | "primary";
}) {
  const classes =
    tone === "danger"
      ? "border-[rgba(185,28,28,0.12)] bg-[rgba(185,28,28,0.05)]"
      : tone === "primary"
        ? "border-[rgba(37,99,235,0.12)] bg-[rgba(37,99,235,0.05)]"
        : "border-[color:var(--border)] bg-white/75";

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${classes}`}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-1 font-heading text-base font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
