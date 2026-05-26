import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoveToTrashButton } from "@/components/trash/trash-ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { normalizeError } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/utils";
import { listInventoryOptions } from "@/modules/inventory/inventory.service";
import {
  getAssignableMechanics,
  getWorkOrderById,
} from "@/modules/work-orders/work-order.service";
import { isWorkOrderEvidenceStorageConfigured } from "@/modules/work-orders/work-order.storage";
import { AssignmentForm } from "@/app/(protected)/work-orders/assignment-form";
import { EvidenceUploadForm } from "@/app/(protected)/work-orders/evidence-upload-form";
import {
  ExistingPartUsageForm,
  PartsUsageForm,
} from "@/app/(protected)/work-orders/parts-usage-form";
import { StatusForm } from "@/app/(protected)/work-orders/status-form";
import { WorkOrderTaskForm } from "@/app/(protected)/work-orders/work-order-task-form";
import { WorkOrderTaskStatusForm } from "@/app/(protected)/work-orders/work-order-task-status-form";
import {
  getWorkOrderAutomaticProgressPercent,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_TASK_STATUS_LABELS,
} from "@/modules/work-orders/work-order.constants";
import { BUDGET_ITEM_TYPE_LABELS, BUDGET_STATUS_LABELS } from "@/modules/budgets/budget.constants";

type WorkOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkOrderDetailPage({ params }: WorkOrderDetailPageProps) {
  const { id } = await params;
  const evidenceUploadsEnabled = isWorkOrderEvidenceStorageConfigured();
  const workOrder = await getWorkOrderById(id).catch((error) => {
    if (normalizeError(error).statusCode === 404) {
      notFound();
    }

    throw error;
  });
  const [mechanics, repuestos] = await Promise.all([
    getAssignableMechanics(),
    listInventoryOptions(),
  ]);
  const completedTasksCount = workOrder.tasks.filter((task) => task.status === "COMPLETED").length;
  const automaticProgressPercent = getWorkOrderAutomaticProgressPercent({
    status: workOrder.status,
    tasks: workOrder.tasks,
  });

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Orden de trabajo
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-semibold">{workOrder.orderNumber}</h1>
              <StatusBadge status={workOrder.status} />
            </div>
            <p className="mt-3 text-sm text-[color:var(--muted-strong)]">
              {workOrder.client.fullName} / {workOrder.vehicle.make} {workOrder.vehicle.model} /{" "}
              {workOrder.vehicle.plate ?? "Sin patente"}
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">{workOrder.reason}</p>
          </div>

          <div className="flex items-start gap-5 lg:items-center">
            <MoveToTrashButton
              entityId={workOrder.id}
              entityType="workOrder"
              redirectTo="/work-orders/trash"
            />
            <div className="flex flex-wrap gap-3">
              {workOrder.insuranceCase ? (
                <Link href={`/insurance-cases/${workOrder.insuranceCase.id}`}>
                  <Button variant="secondary">Ver cliente liquidadora</Button>
                </Link>
              ) : null}
              {workOrder.budget ? (
                <Link href={`/budgets/${workOrder.budget.id}`}>
                  <Button variant="secondary">Ver presupuesto</Button>
                </Link>
              ) : null}
              <Link href={`/vehicles/${workOrder.vehicleId}`}>
                <Button variant="secondary">Ver vehiculo</Button>
              </Link>
              <Link href="/work-orders/new">
                <Button>Nueva orden</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Resumen tecnico</h2>

            <div className="mt-5 space-y-3 text-sm text-[color:var(--muted-strong)]">
              {workOrder.budget ? (
                <div className="rounded-xl border border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.05)] p-4">
                  <p className="text-sm font-semibold text-[#166534]">
                    Origen: presupuesto {workOrder.budget.budgetNumber}
                  </p>
                  <p className="mt-1 text-sm text-[#166534]">
                    Estado origen: {BUDGET_STATUS_LABELS[workOrder.budget.status]}
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#166534]">Repuestos</p>
                      <p className="mt-1 text-lg font-semibold text-[#14532d]">
                        ${workOrder.budget.subtotalParts.toLocaleString("es-CL")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#166534]">Mano de obra</p>
                      <p className="mt-1 text-lg font-semibold text-[#14532d]">
                        ${workOrder.budget.subtotalLabor.toLocaleString("es-CL")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#166534]">Total aprobado</p>
                      <p className="mt-1 text-lg font-semibold text-[#14532d]">
                        ${workOrder.budget.totalAmount.toLocaleString("es-CL")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
              {workOrder.insuranceCase ? (
                <div className="rounded-xl border border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.05)] p-4">
                  <p className="text-sm font-semibold text-[#1d4ed8]">
                    Caso aseguradora: {workOrder.insuranceCase.caseNumber}
                  </p>
                  <p className="mt-1 text-sm text-[#1d4ed8]">
                    Cliente gestionado por la liquidadora {workOrder.insuranceCase.liquidator.name}.
                  </p>
                </div>
              ) : null}
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Diagnostico:</span>{" "}
                {workOrder.initialDiagnosis ?? "Sin diagnostico inicial"}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Fecha ingreso:</span>{" "}
                {formatDate(workOrder.intakeDate)}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Fecha estimada:</span>{" "}
                {formatDate(workOrder.estimatedDate)}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Creada por:</span>{" "}
                {workOrder.createdBy.name}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Tecnico asignado:</span>{" "}
                {workOrder.assignedTechnician?.name ?? "Sin asignar"}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Observaciones:</span>{" "}
                {workOrder.notes ?? "Sin observaciones"}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Avance operativo</h2>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3 text-sm text-[color:var(--muted-strong)]">
                <span>Progreso automatico de la orden</span>
                <span className="font-semibold text-[color:var(--foreground)]">
                  {automaticProgressPercent}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[rgba(37,99,235,0.10)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#17345e_0%,#2563eb_100%)] transition-[width]"
                  style={{ width: `${automaticProgressPercent}%` }}
                />
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--muted-strong)]">
                {workOrder.tasks.length > 0 ? (
                  <p>
                    {completedTasksCount} de {workOrder.tasks.length} tareas completadas. El avance
                    se calcula automaticamente desde las tareas internas de esta OT.
                  </p>
                ) : (
                  <p>
                    Esta orden aun no tiene tareas registradas. Mientras tanto, el avance se estima
                    desde el estado actual de la orden.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {workOrder.budget ? (
          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Items del presupuesto base</h2>

              <div className="mt-5 space-y-3">
                {workOrder.budget.items.map((item) => (
                  <div
                    className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3"
                    key={item.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--foreground)]">
                          {item.description}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--muted)]">
                          {BUDGET_ITEM_TYPE_LABELS[item.itemType]} / {item.referenceCode ?? "Sin codigo"}
                        </p>
                      </div>
                      <div className="text-right text-sm text-[color:var(--muted-strong)]">
                        <p>Cantidad: {item.quantity}</p>
                        <p>Unitario: ${item.unitPrice.toLocaleString("es-CL")}</p>
                        <p className="font-semibold text-[color:var(--foreground)]">
                          Subtotal: ${item.subtotal.toLocaleString("es-CL")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Asignacion</h2>

            <div className="mt-5">
              <AssignmentForm
                currentAssignedTechnicianId={workOrder.assignedTechnicianId}
                mechanics={mechanics.map((mechanic) => ({
                  id: mechanic.id,
                  name: mechanic.name,
                }))}
                orderId={workOrder.id}
              />
            </div>
          </Card>

          <Card className="rounded-2xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold">Tareas internas</h2>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  Registra el trabajo puntual que compone esta orden para hacer seguimiento
                  operativo.
                </p>
              </div>
              <div className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1 text-sm font-medium text-[color:var(--foreground)]">
                {workOrder.tasks.length} tarea{workOrder.tasks.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-5">
              <WorkOrderTaskForm orderId={workOrder.id} />
            </div>

            <div className="mt-6 space-y-4">
              {workOrder.tasks.map((task) => (
                <div
                  className="rounded-xl border border-[color:var(--border)] bg-white/70 p-4"
                  key={task.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-semibold text-[color:var(--foreground)]">
                          {task.title}
                        </p>
                        <span className="rounded-full bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted-strong)]">
                          {WORK_ORDER_TASK_STATUS_LABELS[task.status]}
                        </span>
                      </div>
                      {task.description ? (
                        <p className="text-sm text-[color:var(--muted-strong)]">
                          {task.description}
                        </p>
                      ) : (
                        <p className="text-sm text-[color:var(--muted)]">
                          Sin detalle adicional para esta tarea.
                        </p>
                      )}
                      <p className="text-xs text-[color:var(--muted)]">
                        Creada {formatDateTime(task.createdAt)}
                        {task.completedAt
                          ? ` / completada ${formatDateTime(task.completedAt)}`
                          : ""}
                      </p>
                    </div>

                    <div className="lg:min-w-[180px]">
                      <WorkOrderTaskStatusForm
                        orderId={workOrder.id}
                        status={task.status}
                        taskId={task.id}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {workOrder.tasks.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">
                  Aun no hay tareas registradas dentro de esta orden.
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Cambiar estado</h2>

            <div className="mt-5">
              <StatusForm currentStatus={workOrder.status} orderId={workOrder.id} />
            </div>
          </Card>

          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Repuestos utilizados</h2>

            <div className="mt-5">
              <PartsUsageForm orderId={workOrder.id} repuestos={repuestos} />
            </div>

            <div className="mt-6 space-y-4">
              {workOrder.parts.map((part) => (
                <div
                  className="rounded-xl border border-[color:var(--border)] bg-white/70 p-4"
                  key={part.id}
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="font-semibold text-[color:var(--foreground)]">
                        {part.repuesto.name}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                        {part.repuesto.code} / usado {part.quantity} / stock actual{" "}
                        {part.repuesto.currentStock}
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        Registrado por {part.createdBy.name} / {formatDateTime(part.createdAt)}
                      </p>
                    </div>

                    <ExistingPartUsageForm
                      orderId={workOrder.id}
                      part={{
                        repuestoId: part.repuestoId,
                        quantity: part.quantity,
                      }}
                    />
                  </div>
                </div>
              ))}

              {workOrder.parts.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">
                  Aun no hay repuestos descontados en esta orden.
                </p>
              ) : null}
            </div>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-2xl font-semibold">Evidencias de la orden</h2>
            </div>

            {evidenceUploadsEnabled ? (
              <EvidenceUploadForm orderId={workOrder.id} />
            ) : (
              <div className="rounded-xl border border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.08)] p-4">
                <p className="text-sm font-semibold text-[#b45309]">
                  La carga de evidencias no esta habilitada en este entorno.
                </p>
                <p className="mt-1 text-sm text-[#b45309]">
                  La orden sigue funcionando normal, pero falta configurar Supabase Storage
                  para subir imagenes.
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {workOrder.evidences.map((evidence) => (
                <div
                  className="rounded-xl border border-[color:var(--border)] bg-white/70 p-3"
                  key={evidence.id}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={evidence.fileName}
                    className="h-44 w-full rounded-xl object-cover"
                    src={evidence.fileUrl}
                  />
                  <p className="mt-3 text-sm font-semibold text-[color:var(--foreground)]">
                    {evidence.fileName}
                  </p>
                  {evidence.note ? (
                    <p className="mt-1 text-xs text-[color:var(--muted-strong)]">{evidence.note}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[color:var(--muted)]">
                    {evidence.uploadedBy.name} / {formatDateTime(evidence.createdAt)}
                  </p>
                </div>
              ))}
            </div>

            {workOrder.evidences.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                Aun no hay evidencias adjuntas a esta orden.
              </p>
            ) : null}

            <div>
              <h2 className="font-heading text-2xl font-semibold">Bitacora de estados</h2>
            </div>

            <div className="space-y-4">
              {workOrder.statusLogs.map((log) => (
                <div
                  className="rounded-lg border border-[color:var(--border)] bg-white/70 p-4"
                  key={log.id}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={log.nextStatus} />
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      {WORK_ORDER_STATUS_LABELS[log.nextStatus]}
                    </p>
                  </div>
                  {log.previousStatus ? (
                    <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                      Desde {WORK_ORDER_STATUS_LABELS[log.previousStatus]}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                    {log.note ?? "Sin nota"}
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">
                    {log.changedBy.name} / {formatDateTime(log.changedAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
