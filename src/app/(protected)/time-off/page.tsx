import { redirect } from "next/navigation";
import { TimeOffRequestStatus, UserRole } from "@prisma/client";

import {
  TimeOffRequestForm,
  TimeOffReviewForm,
} from "@/app/(protected)/time-off/time-off-forms";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getCurrentSession } from "@/modules/auth/auth.service";
import {
  TIME_OFF_REQUEST_STATUS_LABELS,
  TIME_OFF_REQUEST_TYPE_LABELS,
} from "@/modules/time-off/time-off.constants";
import { getTimeOffOverview } from "@/modules/time-off/time-off.service";

export default async function TimeOffPage() {
  const session = await getCurrentSession();

  if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MECHANIC)) {
    redirect("/dashboard");
  }

  const overview = await getTimeOffOverview({
    id: session.user.id,
    role: session.user.role,
  });

  if (overview.mode === "mechanic") {
    return (
      <div className="space-y-6">
        <section className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Mis permisos
          </p>
          <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">
            Solicitudes de dias libres
          </h1>
          <p className="text-sm text-[color:var(--muted-strong)]">
            Solicita vacaciones, permisos o licencias y revisa el estado de cada solicitud.
          </p>
        </section>

        <Card>
          <h2 className="font-heading text-xl font-semibold">Nueva solicitud</h2>
          <div className="mt-5">
            <TimeOffRequestForm />
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b border-[color:var(--border)] px-6 py-4">
            <h2 className="font-heading text-xl font-semibold">Historial</h2>
          </div>
          <div className="divide-y divide-[color:var(--border)]">
            {overview.requests.map((request) => (
              <TimeOffRow key={request.id} request={request} />
            ))}
            {overview.requests.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-[color:var(--muted)]">
                Aun no tienes solicitudes registradas.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
          Administracion
        </p>
        <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">
          Permisos y vacaciones
        </h1>
        <p className="text-sm text-[color:var(--muted-strong)]">
          Revisa solicitudes de mecanicos con contexto de carga activa antes de aprobar.
        </p>
      </section>

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold">Bandeja pendiente</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {overview.pendingRequests.length} solicitud(es) esperando revision.
            </p>
          </div>
          <Badge tone={overview.pendingRequests.some((request) => request.workload.isHighLoad) ? "warning" : "success"}>
            {overview.pendingRequests.some((request) => request.workload.isHighLoad)
              ? "Carga alta detectada"
              : "Carga normal"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4">
          {overview.pendingRequests.map((request) => (
            <div
              className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-5"
              key={request.id}
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                      {request.mechanic.name}
                    </h3>
                    <TimeOffStatusBadge status={request.status} />
                    {request.workload.isHighLoad ? <Badge tone="warning">Semana cargada</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                    {TIME_OFF_REQUEST_TYPE_LABELS[request.type]} / {formatDate(request.startDate)} -{" "}
                    {formatDate(request.endDate)}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {request.reason ?? "Sin motivo informado"}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <LoadStat
                      label="OT activas en rango"
                      value={String(request.workload.activeOrdersInRange)}
                    />
                    <LoadStat
                      isWarning={request.workload.assignedOrdersInRange >= 3}
                      label="Asignadas al mecanico"
                      value={String(request.workload.assignedOrdersInRange)}
                    />
                  </div>
                </div>

                <TimeOffReviewForm requestId={request.id} />
              </div>
            </div>
          ))}
          {overview.pendingRequests.length === 0 ? (
            <p className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-8 text-center text-sm text-[color:var(--muted)]">
              No hay solicitudes pendientes.
            </p>
          ) : null}
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b border-[color:var(--border)] px-6 py-4">
          <h2 className="font-heading text-xl font-semibold">Historial revisado</h2>
        </div>
        <div className="divide-y divide-[color:var(--border)]">
          {overview.history.map((request) => (
            <TimeOffRow key={request.id} request={request} showMechanic />
          ))}
          {overview.history.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[color:var(--muted)]">
              Aun no hay solicitudes revisadas.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function TimeOffRow({
  request,
  showMechanic = false,
}: {
  request: {
    id: string;
    type: keyof typeof TIME_OFF_REQUEST_TYPE_LABELS;
    status: TimeOffRequestStatus;
    startDate: Date;
    endDate: Date;
    reason: string | null;
    reviewNote: string | null;
    reviewedAt: Date | null;
    mechanic: {
      name: string;
    };
    reviewedBy: {
      name: string;
    } | null;
  };
  showMechanic?: boolean;
}) {
  return (
    <div className="grid gap-4 px-6 py-4 lg:grid-cols-[1fr_180px_180px] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-[color:var(--foreground)]">
            {showMechanic ? `${request.mechanic.name} / ` : ""}
            {TIME_OFF_REQUEST_TYPE_LABELS[request.type]}
          </p>
          <TimeOffStatusBadge status={request.status} />
        </div>
        <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
          {request.reason ?? "Sin motivo informado"}
        </p>
        {request.reviewNote ? (
          <p className="mt-1 text-sm text-[color:var(--muted)]">Revision: {request.reviewNote}</p>
        ) : null}
      </div>
      <p className="text-sm text-[color:var(--muted-strong)]">
        {formatDate(request.startDate)} - {formatDate(request.endDate)}
      </p>
      <p className="text-sm text-[color:var(--muted)]">
        {request.reviewedBy
          ? `${request.reviewedBy.name} / ${formatDate(request.reviewedAt)}`
          : "Pendiente de revision"}
      </p>
    </div>
  );
}

function TimeOffStatusBadge({ status }: { status: TimeOffRequestStatus }) {
  const tone =
    status === TimeOffRequestStatus.APPROVED
      ? "success"
      : status === TimeOffRequestStatus.REJECTED
        ? "warning"
        : "info";

  return <Badge tone={tone}>{TIME_OFF_REQUEST_STATUS_LABELS[status]}</Badge>;
}

function LoadStat({
  label,
  value,
  isWarning = false,
}: {
  label: string;
  value: string;
  isWarning?: boolean;
}) {
  return (
    <div
      className={
        isWarning
          ? "rounded-[var(--radius-control)] border border-[rgba(161,92,7,0.2)] bg-[color:var(--warning-soft)] px-4 py-3"
          : "rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3"
      }
    >
      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
