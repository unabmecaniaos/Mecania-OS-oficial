"use client";

import { useActionState } from "react";
import { BillingDocumentType, PaymentStatus } from "@prisma/client";

import { createBillingDocumentAction } from "@/app/(protected)/work-orders/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/form-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  BILLING_DOCUMENT_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/modules/billing/billing.constants";

type BillingDocumentSummary = {
  id: string;
  type: BillingDocumentType;
  folio: string;
  issuedAt: Date;
  pdfFileName: string;
  totalAmount: number;
};

type BillingDocumentFormProps = {
  orderId: string;
  paymentStatus: PaymentStatus;
  subtotalParts: number;
  subtotalLabor: number;
  subtotalSupplies: number;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  documents: BillingDocumentSummary[];
};

export function BillingDocumentForm({
  orderId,
  paymentStatus,
  subtotalParts,
  subtotalLabor,
  subtotalSupplies,
  netAmount,
  vatAmount,
  totalAmount,
  documents,
}: BillingDocumentFormProps) {
  const [state, formAction] = useActionState(createBillingDocumentAction, initialActionState);
  const isPaid = paymentStatus === PaymentStatus.PAID;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">Base repuestos</p>
          <p className="mt-2 font-semibold text-[color:var(--foreground)]">{formatCurrency(subtotalParts)}</p>
        </div>
        <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">Base mano de obra</p>
          <p className="mt-2 font-semibold text-[color:var(--foreground)]">{formatCurrency(subtotalLabor)}</p>
        </div>
        <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">Suministros</p>
          <p className="mt-2 font-semibold text-[color:var(--foreground)]">{formatCurrency(subtotalSupplies)}</p>
        </div>
        <div className="rounded-xl border border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.06)] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#1d4ed8]">Monto neto</p>
          <p className="mt-2 font-semibold text-[#1e3a8a]">{formatCurrency(netAmount)}</p>
        </div>
        <div className="rounded-xl border border-[rgba(217,119,6,0.18)] bg-[rgba(217,119,6,0.06)] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#b45309]">IVA 19%</p>
          <p className="mt-2 font-semibold text-[#92400e]">{formatCurrency(vatAmount)}</p>
        </div>
        <div className="rounded-xl border border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.06)] p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#166534]">Total final</p>
          <p className="mt-2 font-semibold text-[#14532d]">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {!isPaid ? (
        <FormMessage
          message={`La orden aun no esta pagada. Estado actual: ${PAYMENT_STATUS_LABELS[paymentStatus]}.`}
          tone="info"
        />
      ) : null}

      <form action={formAction} className="space-y-4 rounded-xl border border-[color:var(--border)] bg-white/70 p-4">
        <input name="orderId" type="hidden" value={orderId} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="type">
              Tipo de documento
            </label>
            <select
              className="min-h-11 w-full rounded-xl border border-[color:var(--border)] bg-white px-4 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[rgba(37,99,235,0.12)]"
              defaultValue={BillingDocumentType.INVOICE}
              disabled={!isPaid}
              id="type"
              name="type"
            >
              <option value={BillingDocumentType.INVOICE}>{BILLING_DOCUMENT_TYPE_LABELS[BillingDocumentType.INVOICE]}</option>
              <option value={BillingDocumentType.RECEIPT}>{BILLING_DOCUMENT_TYPE_LABELS[BillingDocumentType.RECEIPT]}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="folio">
              Folio
            </label>
            <Input disabled={!isPaid} id="folio" name="folio" placeholder="Ej. 10025" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="customerTaxId">
              RUT o ID tributario
            </label>
            <Input disabled={!isPaid} id="customerTaxId" name="customerTaxId" placeholder="12.345.678-9" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="customerBusinessName">
              Razon social o nombre
            </label>
            <Input disabled={!isPaid} id="customerBusinessName" name="customerBusinessName" placeholder="Nombre del cliente o empresa" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--muted-strong)]" htmlFor="notes">
            Observaciones
          </label>
          <Textarea disabled={!isPaid} id="notes" name="notes" placeholder="Notas opcionales para el documento" />
        </div>

        <FormMessage message={state.error} />
        <SubmitButton disabled={!isPaid} label="Generar documento y habilitar PDF" pendingLabel="Generando documento..." />
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">Documentos generados</p>
          <div className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-medium text-[color:var(--foreground)]">
            {documents.length} documento{documents.length === 1 ? "" : "s"}
          </div>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">Aun no se ha generado ninguna factura o boleta para esta orden.</p>
        ) : (
          documents.map((document) => (
            <div className="rounded-xl border border-[color:var(--border)] bg-white/75 p-4" key={document.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">
                    {BILLING_DOCUMENT_TYPE_LABELS[document.type]} #{document.folio}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                    Emitido {formatDateTime(document.issuedAt)} / Total {formatCurrency(document.totalAmount)}
                  </p>
                </div>
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--border-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:border-[#2563eb] hover:bg-white"
                  href={`/api/billing-documents/${document.id}/pdf`}
                >
                  Descargar PDF
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
