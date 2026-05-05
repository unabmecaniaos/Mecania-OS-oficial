import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoveToTrashButton } from "@/components/trash/trash-ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { normalizeError } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getVehicleById } from "@/modules/vehicles/vehicle.service";
import { WORK_ORDER_STATUS_LABELS } from "@/modules/work-orders/work-order.constants";

type VehicleDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { id } = await params;
  const vehicle = await getVehicleById(id).catch((error) => {
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
              Ficha tecnica
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="mt-3 text-sm text-[color:var(--muted-strong)]">
              {vehicle.client.fullName} / {vehicle.plate ?? "Sin patente"}
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              VIN {vehicle.vin} / Ano {vehicle.year} / Kilometraje {vehicle.mileage ?? "-"}
            </p>
          </div>

          <div className="flex items-start gap-5 lg:items-center">
            <MoveToTrashButton entityId={vehicle.id} entityType="vehicle" redirectTo="/vehicles/trash" />
            <div className="flex flex-wrap gap-3">
              <Link href={`/work-orders/new?clientId=${vehicle.clientId}&vehicleId=${vehicle.id}`}>
                <Button>Nueva orden</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="rounded-2xl">
          <h2 className="font-heading text-2xl font-semibold">Datos del vehiculo</h2>

          <div className="mt-5 space-y-3 text-sm text-[color:var(--muted-strong)]">
            <p>
              <span className="font-semibold text-[color:var(--foreground)]">Cliente:</span>{" "}
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
              <span className="font-semibold text-[color:var(--foreground)]">Creado:</span>{" "}
              {formatDate(vehicle.createdAt)}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-semibold">Historial tecnico</h2>
            </div>
            <div className="rounded-md bg-[color:var(--surface-strong)] px-4 py-2 text-sm">
              {vehicle.workOrders.length} ordenes
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {vehicle.workOrders.map((order) => {
              const latestLog = order.statusLogs[0];

              return (
                <Link
                  className="block rounded-lg border border-[color:var(--border)] bg-white/70 p-4 transition hover:border-[color:var(--border-strong)]"
                  href={`/work-orders/${order.id}`}
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
                  {latestLog ? (
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      Ultimo cambio: {WORK_ORDER_STATUS_LABELS[latestLog.nextStatus]} /{" "}
                      {formatDateTime(latestLog.changedAt)}
                    </p>
                  ) : null}
                </Link>
              );
            })}

            {vehicle.workOrders.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                Este vehiculo aun no tiene historial de servicios.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
