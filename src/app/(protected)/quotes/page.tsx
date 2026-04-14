import Link from "next/link";
import { QuoteRecipientType, QuoteStatus } from "@prisma/client";

import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  QUOTE_RECIPIENT_LABELS,
  QUOTE_RECIPIENT_OPTIONS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_OPTIONS,
} from "@/modules/quotes/quote.constants";
import { listQuotes } from "@/modules/quotes/quote.service";

type QuotesPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: QuoteStatus;
    recipient?: QuoteRecipientType;
  }>;
};

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const { q, status, recipient } = await searchParams;
  const quotes = await listQuotes({
    q,
    status,
    recipient,
  });

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Ciclo comercial tecnico
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">Presupuestos</h1>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <form className="flex flex-col gap-3 md:flex-row" method="get">
              <Input
                defaultValue={q}
                name="q"
                placeholder="Buscar por numero, cliente, vehiculo o descripcion"
              />
              <Select defaultValue={status ?? ""} name="status">
                <option value="">Todos los estados</option>
                {QUOTE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Select defaultValue={recipient ?? ""} name="recipient">
                <option value="">Todos los destinatarios</option>
                {QUOTE_RECIPIENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary">
                Filtrar
              </Button>
            </form>

            <Link href="/quotes/new">
              <Button>Nuevo presupuesto</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {quotes.map((quote) => (
          <Card className="rounded-xl" key={quote.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-heading text-2xl font-semibold">{quote.quoteNumber}</h2>
                  <QuoteStatusBadge status={quote.status} />
                </div>
                <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                  {quote.client.fullName} / {quote.vehicle.make} {quote.vehicle.model} /{" "}
                  {quote.vehicle.plate ?? "Sin patente"}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {quote.summary ?? "Sin resumen general"}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {QUOTE_RECIPIENT_LABELS[quote.recipientType]} / {quote._count.items} items /{" "}
                  {formatCurrency(Number(quote.totalAmount))}
                </p>
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <p className="text-sm text-[color:var(--muted)]">
                  Creado {formatDate(quote.createdAt)}
                </p>
                <p className="text-sm text-[color:var(--muted)]">
                  Estado {QUOTE_STATUS_LABELS[quote.status]}
                </p>
                <Link
                  className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                  href={`/quotes/${quote.id}`}
                >
                  Abrir presupuesto
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {quotes.length === 0 ? (
          <Card className="rounded-xl text-center">
            <p className="text-[color:var(--muted-strong)]">
              No hay presupuestos que coincidan con esos filtros.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
