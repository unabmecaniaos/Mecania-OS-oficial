import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteStatus } from "@prisma/client";

import { ApproveQuoteForm } from "@/app/(protected)/quotes/approve-form";
import { RejectQuoteForm } from "@/app/(protected)/quotes/reject-form";
import { SendQuoteForm } from "@/app/(protected)/quotes/send-form";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { normalizeError } from "@/lib/errors";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  QUOTE_ITEM_TYPE_LABELS,
  QUOTE_RECIPIENT_LABELS,
  QUOTE_STATUS_LABELS,
} from "@/modules/quotes/quote.constants";
import { getQuoteById } from "@/modules/quotes/quote.service";

type QuoteDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;
  const quote = await getQuoteById(id).catch((error) => {
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
              Presupuesto
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-semibold">{quote.quoteNumber}</h1>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <p className="mt-3 text-sm text-[color:var(--muted-strong)]">
              {quote.client.fullName} / {quote.vehicle.make} {quote.vehicle.model} /{" "}
              {quote.vehicle.plate ?? "Sin patente"}
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {quote.summary ?? "Sin resumen general definido"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {quote.selfInspection ? (
              <Link href={`/self-inspections/${quote.selfInspection.id}`}>
                <Button variant="secondary">Ver autoinspeccion</Button>
              </Link>
            ) : null}
            <Link href={`/vehicles/${quote.vehicleId}`}>
              <Button variant="secondary">Ver vehiculo</Button>
            </Link>
            <Link href="/quotes/new">
              <Button>Nuevo presupuesto</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Resumen comercial</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Destinatario
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {QUOTE_RECIPIENT_LABELS[quote.recipientType]}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Total
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {formatCurrency(Number(quote.totalAmount))}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Creado
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {formatDateTime(quote.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Registrado por
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">{quote.createdBy.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Enviado
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {formatDateTime(quote.sentAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Actor de envio
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {quote.sentBy?.name ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Aprobado
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {formatDateTime(quote.approvedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Actor de aprobacion
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {quote.approvedBy?.name ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Rechazado
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {formatDateTime(quote.rejectedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Actor de rechazo
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {quote.rejectedBy?.name ?? "-"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Contexto tecnico</h2>
            <div className="mt-5 space-y-3 text-sm text-[color:var(--muted-strong)]">
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Cliente:</span>{" "}
                {quote.client.fullName}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Vehiculo:</span>{" "}
                {quote.vehicle.make} {quote.vehicle.model} / {quote.vehicle.plate ?? quote.vehicle.vin}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Estado:</span>{" "}
                {QUOTE_STATUS_LABELS[quote.status]}
              </p>
              <p>
                <span className="font-semibold text-[color:var(--foreground)]">Notas internas:</span>{" "}
                {quote.internalNotes ?? "Sin notas internas"}
              </p>
              {quote.selfInspection ? (
                <p>
                  <span className="font-semibold text-[color:var(--foreground)]">
                    Autoinspeccion asociada:
                  </span>{" "}
                  Revisada el {formatDate(quote.selfInspection.reviewedAt)}
                </p>
              ) : (
                <p>
                  <span className="font-semibold text-[color:var(--foreground)]">
                    Autoinspeccion asociada:
                  </span>{" "}
                  No aplica
                </p>
              )}
            </div>
          </Card>

          {quote.status === QuoteStatus.DRAFT ? (
            <Card className="rounded-2xl">
              <h2 className="font-heading text-2xl font-semibold">Enviar presupuesto</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Cambia el borrador a estado enviado para dejarlo disponible para revision externa.
              </p>
              <div className="mt-5">
                <SendQuoteForm quoteId={quote.id} />
              </div>
            </Card>
          ) : null}

          {quote.status === QuoteStatus.SENT ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-2xl">
                <h2 className="font-heading text-2xl font-semibold">Aprobar presupuesto</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  Registra la aprobacion cuando el cliente o aseguradora autoricen avanzar.
                </p>
                <div className="mt-5">
                  <ApproveQuoteForm quoteId={quote.id} />
                </div>
              </Card>

              <Card className="rounded-2xl">
                <h2 className="font-heading text-2xl font-semibold">Rechazar presupuesto</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  Deja constancia de un rechazo para bloquear su uso como base de una OT.
                </p>
                <div className="mt-5">
                  <RejectQuoteForm quoteId={quote.id} />
                </div>
              </Card>
            </div>
          ) : null}

          {quote.status === QuoteStatus.APPROVED ? (
            <Card className="rounded-2xl border-[rgba(14,79,82,0.16)] bg-[rgba(14,79,82,0.08)]">
              <h2 className="font-heading text-2xl font-semibold text-[color:var(--success)]">
                Listo para orden de trabajo
              </h2>
              <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                Este presupuesto ya quedo autorizado y esta listo para convertirse en una orden de
                trabajo en el siguiente paso del sprint.
              </p>
            </Card>
          ) : null}

          {quote.status === QuoteStatus.REJECTED ? (
            <Card className="rounded-2xl">
              <h2 className="font-heading text-2xl font-semibold">Presupuesto rechazado</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Mientras este presupuesto permanezca rechazado, no debe utilizarse como base para
                crear una orden de trabajo.
              </p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Desglose del presupuesto</h2>
            <div className="mt-5 space-y-3">
              {quote.items.map((item) => (
                <div
                  className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4"
                  key={item.id}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        {QUOTE_ITEM_TYPE_LABELS[item.type]}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                        {item.description}
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        {Number(item.quantity)} x {formatCurrency(Number(item.unitPrice))}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      {formatCurrency(Number(item.lineTotal))}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.06)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#1d4ed8]">Total</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-[#1d4ed8]">
                {formatCurrency(Number(quote.totalAmount))}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl">
            <h2 className="font-heading text-2xl font-semibold">Bitacora de estados</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Cada accion queda trazada con actor responsable y fecha.
            </p>

            <div className="mt-5 space-y-4">
              {quote.statusLogs.map((log) => (
                <div
                  className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-4"
                  key={log.id}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <QuoteStatusBadge status={log.nextStatus} />
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      {QUOTE_STATUS_LABELS[log.nextStatus]}
                    </p>
                  </div>
                  {log.previousStatus ? (
                    <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                      Desde {QUOTE_STATUS_LABELS[log.previousStatus]}
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
          </Card>
        </div>
      </div>
    </div>
  );
}
