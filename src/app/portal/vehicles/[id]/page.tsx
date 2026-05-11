import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkOrderProgress } from "@/components/customer-portal/work-order-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { normalizeError } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getCustomerPortalVehicleDetail } from "@/modules/customer-portal/customer-portal.service";
import { WORK_ORDER_STATUS_LABELS } from "@/modules/work-orders/work-order.constants";

type CustomerVehicleDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CustomerVehicleDetailPage({
  params,
}: CustomerVehicleDetailPageProps) {
  const { id } = await params;
  const vehicle = await getCustomerPortalVehicleDetail(id).catch((error) => {
    if (normalizeError(error).statusCode === 404) {
      notFound();
    }

    throw error;
  });

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Mi vehiculo
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-semibold">
                {vehicle.make} {vehicle.model}
              </h1>
              {vehicle.currentOrder ? <StatusBadge status={vehicle.currentOrder.status} /> : null}
            </div>
            <p className="mt-3 text-sm text-[color:var(--muted-strong)]">
              {vehicle.plate ?? "Sin patente"} / VIN {vehicle.vin}
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Ano {vehicle.year} / Kilometraje {vehicle.mileage ?? "-"}
            </p>
          </div>

          <Link href="/portal">
            <Button variant="secondary">Volver a mis vehiculos</Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Ficha del vehiculo</h2>

            <div className="mt-5 space-y-3 text-sm text-[color:var(--muted-strong)]">
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Titular:</span>{" "}
                {vehicle.client.fullName}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Patente:</span>{" "}
                {vehicle.plate ?? "No registrada"}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">VIN:</span> {vehicle.vin}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Color:</span>{" "}
                {vehicle.color ?? "No indicado"}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Registrado:</span>{" "}
                {formatDate(vehicle.createdAt)}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Estado actual</h2>

            {vehicle.currentOrder ? (
              <div className="mt-5 space-y-4">
                <WorkOrderProgress
                  progressPercent={vehicle.progressPercent}
                  status={vehicle.currentOrder.status}
                />
                <div className="space-y-2 text-sm text-[color:var(--muted-strong)]">
                  <p>
                    <span className="font-semibold text-[color:var(--foreground)]">Orden:</span>{" "}
                    {vehicle.currentOrder.orderNumber}
                  </p>
                  <p>
                    <span className="font-semibold text-[color:var(--foreground)]">Motivo:</span>{" "}
                    {vehicle.currentOrder.reason}
                  </p>
                  <p>
                    <span className="font-semibold text-[color:var(--foreground)]">Ingreso:</span>{" "}
                    {formatDate(vehicle.currentOrder.intakeDate)}
                  </p>
                  <p>
                    <span className="font-semibold text-[color:var(--foreground)]">Entrega estimada:</span>{" "}
                    {formatDate(vehicle.currentOrder.estimatedDate)}
                  </p>
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <div>
              <h2 className="font-heading text-2xl font-semibold">Historial y progreso</h2>
            </div>

            {vehicle.featuredOrder ? (
              <div className="mt-5 space-y-4">
                {vehicle.featuredOrder.statusLogs.map((log) => (
                  <div
                    className="rounded-xl border border-[color:var(--border)] bg-white/70 p-4"
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
                      {log.note ?? "Sin comentario adicional"}
                    </p>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      {log.changedBy.name} / {formatDateTime(log.changedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="rounded-2xl">
            <div>
              <h2 className="font-heading text-2xl font-semibold">Evidencia visible</h2>
            </div>

            {vehicle.featuredOrder && vehicle.featuredOrder.evidences.length > 0 ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {vehicle.featuredOrder.evidences.map((evidence) => (
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
            ) : null}
          </Card>

          <Card className="rounded-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold">Ordenes del vehiculo</h2>
              </div>
              <div className="rounded-md bg-[color:var(--surface-strong)] px-4 py-2 text-sm">
                {vehicle.workOrders.length} ordenes
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {vehicle.workOrders.map((order) => (
                <div
                  className="rounded-xl border border-[color:var(--border)] bg-white/70 p-4"
                  key={order.id}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold">{order.orderNumber}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted-strong)]">{order.reason}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Ingreso {formatDate(order.intakeDate)}
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">
                    {order.statusLogs[0]
                      ? `Ultimo cambio: ${WORK_ORDER_STATUS_LABELS[order.statusLogs[0].nextStatus]} / ${formatDateTime(order.statusLogs[0].changedAt)}`
                      : "Sin movimientos registrados"}
                  </p>
                </div>
              ))}

              {vehicle.workOrders.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">
                  Este vehiculo aun no tiene ordenes registradas.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
