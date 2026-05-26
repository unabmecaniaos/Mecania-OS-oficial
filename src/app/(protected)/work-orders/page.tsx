import Link from "next/link";
import { WorkOrderStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { MoveToTrashButton, SectionTrashLink } from "@/components/trash/trash-ui";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { listClients } from "@/modules/clients/client.service";
import { listInternalInsuranceCases } from "@/modules/insurance-cases/insurance-case.service";
import { BudgetStatusBadge } from "@/modules/budgets/budget-status-badge";
import {
  getWorkOrderAutomaticProgressPercent,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_OPTIONS,
  isClosedStatus,
} from "@/modules/work-orders/work-order.constants";
import { listWorkOrders } from "@/modules/work-orders/work-order.service";

type WorkOrdersView = "orders" | "workshop-clients" | "liquidator-clients";

type WorkOrdersPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: WorkOrderStatus;
    view?: string;
  }>;
};

const WORK_ORDER_VIEWS: Array<{ value: WorkOrdersView; label: string }> = [
  { value: "orders", label: "Ordenes" },
  { value: "workshop-clients", label: "Clientes taller" },
  { value: "liquidator-clients", label: "Clientes liquidadora" },
];

function resolveView(value?: string): WorkOrdersView {
  if (value === "workshop-clients" || value === "liquidator-clients") {
    return value;
  }

  return "orders";
}

export default async function WorkOrdersPage({ searchParams }: WorkOrdersPageProps) {
  const { q, status, view } = await searchParams;
  const currentView = resolveView(view);
  const session = await getCurrentSession();

  const workOrders =
    currentView === "orders"
      ? await listWorkOrders({
          search: q,
          status,
          actorId: session?.user.id,
          actorRole: session?.user.role,
        })
      : [];
  const workshopClients = currentView === "workshop-clients" ? await listClients(q) : [];
  const liquidatorClients =
    currentView === "liquidator-clients" ? await listInternalInsuranceCases(q) : [];

  const openOrders = workOrders.filter((order) => !isClosedStatus(order.status)).length;
  const waitingApproval = workOrders.filter(
    (order) => order.status === WorkOrderStatus.WAITING_APPROVAL,
  ).length;
  const readyForDelivery = workOrders.filter(
    (order) => order.status === WorkOrderStatus.READY_FOR_DELIVERY,
  ).length;
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
      <Card className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(239,246,255,0.94)_100%)]">
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Centro operativo
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold">Ordenes y clientes</h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {currentView === "orders" ? (
                <>
                  <HeroStat label="Abiertas" value={openOrders} />
                  <HeroStat label="Esperando aprobacion" value={waitingApproval} />
                  <HeroStat label="Listas para entrega" value={readyForDelivery} />
                </>
              ) : null}
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
          </div>

          <div className="flex flex-wrap gap-2">
            {WORK_ORDER_VIEWS.map((item) => (
              <Link
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                  currentView === item.value
                    ? "border-[rgba(37,99,235,0.22)] bg-[linear-gradient(180deg,rgba(37,99,235,0.18),rgba(37,99,235,0.10))] text-[#1d4ed8] shadow-[0_10px_24px_rgba(37,99,235,0.10)]"
                    : "border-transparent bg-transparent text-[color:var(--muted-strong)] hover:border-[rgba(37,99,235,0.12)] hover:bg-[rgba(37,99,235,0.08)] hover:text-[#1d4ed8]",
                )}
                href={`/work-orders?view=${item.value}`}
                key={item.value}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {currentView === "orders" ? (
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <form className="flex flex-col gap-3 sm:flex-row xl:min-w-[640px]" method="get">
                <input name="view" type="hidden" value={currentView} />
                <Input
                  defaultValue={q}
                  name="q"
                  placeholder="Buscar por OT, cliente, VIN o patente"
                />
                <Select defaultValue={status ?? ""} name="status">
                  <option value="">Todos los estados</option>
                  {WORK_ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Button className="sm:min-w-[120px]" type="submit" variant="secondary">
                  Filtrar
                </Button>
              </form>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/work-orders/new">
                  <Button className="w-full sm:w-auto">Nueva orden</Button>
                </Link>
                <SectionTrashLink href="/work-orders/trash" />
              </div>
            </div>
          ) : null}

          {currentView === "workshop-clients" ? (
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <form className="flex flex-col gap-3 sm:flex-row xl:min-w-[520px]" method="get">
                <input name="view" type="hidden" value={currentView} />
                <Input
                  defaultValue={q}
                  name="q"
                  placeholder="Buscar por nombre, correo o telefono"
                />
                <Button className="sm:min-w-[120px]" type="submit" variant="secondary">
                  Buscar
                </Button>
              </form>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/clients/new">
                  <Button className="w-full sm:w-auto">Nuevo cliente</Button>
                </Link>
                <SectionTrashLink href="/clients/trash" />
              </div>
            </div>
          ) : null}

          {currentView === "liquidator-clients" ? (
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <form className="flex flex-col gap-3 sm:flex-row xl:min-w-[520px]" method="get">
                <input name="view" type="hidden" value={currentView} />
                <Input
                  defaultValue={q}
                  name="q"
                  placeholder="Buscar por titular, liquidadora, patente, VIN o caso"
                />
                <Button className="sm:min-w-[120px]" type="submit" variant="secondary">
                  Buscar
                </Button>
              </form>

              <div className="rounded-xl border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.06)] px-4 py-3 text-sm text-[#1d4ed8]">
                Presupuestos pendientes: {liquidatorBudgetsPending}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {currentView === "orders" ? (
        <div className="space-y-4">
          {workOrders.map((order) => (
            <Card className="rounded-xl" key={order.id}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-heading text-2xl font-semibold">{order.orderNumber}</h2>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-[color:var(--muted-strong)]">
                    {order.client.fullName} / {order.vehicle.make} {order.vehicle.model}
                  </p>
                  <p className="text-sm text-[color:var(--muted)]">
                    Tecnico: {order.assignedTechnician?.name ?? "Sin asignar"}
                  </p>
                  <p className="text-sm text-[color:var(--muted)]">{order.reason}</p>
                  <div className="max-w-xl space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
                      <span>Avance operativo</span>
                      <span>
                        {getWorkOrderAutomaticProgressPercent({
                          status: order.status,
                          tasks: order.tasks,
                        })}
                        %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(37,99,235,0.10)]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#17345e_0%,#2563eb_100%)] transition-[width]"
                        style={{
                          width: `${getWorkOrderAutomaticProgressPercent({
                            status: order.status,
                            tasks: order.tasks,
                          })}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-[color:var(--muted)]">
                      {order.tasks.length > 0
                        ? `${order.tasks.filter((task) => task.status === "COMPLETED").length} de ${order.tasks.length} tareas completadas`
                        : "Sin tareas registradas, avance estimado por estado"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:items-center">
                  <MoveToTrashButton
                    entityId={order.id}
                    entityType="workOrder"
                    redirectTo="/work-orders"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-medium">
                      Ingreso {formatDate(order.intakeDate)}
                    </div>
                    <div className="rounded-xl border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-medium">
                      {WORK_ORDER_STATUS_LABELS[order.status]}
                    </div>
                    <Link
                      className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                      href={`/work-orders/${order.id}`}
                    >
                      Abrir orden
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {workOrders.length === 0 ? (
            <Card className="rounded-xl text-center">
              <p className="text-[color:var(--muted-strong)]">
                No hay ordenes de trabajo con esos filtros.
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

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:items-center">
                  <MoveToTrashButton
                    entityId={client.id}
                    entityType="client"
                    redirectTo="/work-orders?view=workshop-clients"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-medium">
                      {client._count.vehicles} vehiculos
                    </div>
                    <div className="rounded-xl border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-medium">
                      {client._count.workOrders} ordenes
                    </div>
                    <Link
                      className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                      href={`/clients/${client.id}`}
                    >
                      Ver detalle
                    </Link>
                  </div>
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

              {insuranceCase.latestBudget ? (
                <p className="mt-4 text-sm text-[color:var(--muted)]">
                  Monto actual: {formatCurrency(insuranceCase.latestBudget.totalAmount)}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap justify-end gap-4">
                {!insuranceCase.latestBudget ? (
                  <Link
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                    href={`/budgets/new?kind=liquidator&insuranceCaseId=${insuranceCase.id}`}
                  >
                    Crear presupuesto
                  </Link>
                ) : null}
                <Link
                  className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                  href={`/insurance-cases/${insuranceCase.id}`}
                >
                  Ver cliente liquidadora
                </Link>
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
