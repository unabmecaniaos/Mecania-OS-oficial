import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { PayrollForm } from "@/app/(protected)/payroll/payroll-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCurrentSession } from "@/modules/auth/auth.service";
import { MECHANIC_PAYMENT_CONCEPT_LABELS } from "@/modules/payroll/payroll.constants";
import { getPayrollOverview } from "@/modules/payroll/payroll.service";

type PayrollPageProps = {
  searchParams: Promise<{
    mechanicId?: string;
  }>;
};

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const session = await getCurrentSession();

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const { mechanicId } = await searchParams;
  const overview = await getPayrollOverview(
    {
      mechanicId,
    },
    {
      id: session.user.id,
      role: session.user.role,
    },
  );
  const totalPaid = overview.payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Administracion
          </p>
          <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">
            Nomina de mecanicos
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Registra pagos internos a mecanicos sin mezclarlos con presupuestos ni pagos de clientes.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryStat label="Total filtrado" value={formatCurrency(totalPaid)} />
          <SummaryStat label="Pagos" value={String(overview.payments.length)} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <h2 className="font-heading text-xl font-semibold">Nuevo pago</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Solo aparecen mecanicos activos.
          </p>
          <div className="mt-5">
            <PayrollForm mechanics={overview.mechanics} />
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold">Total por mecanico</h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Resumen historico acumulado.
              </p>
            </div>
            {overview.selectedMechanicId ? (
              <Link href="/payroll">
                <Button variant="secondary">Ver todos</Button>
              </Link>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3">
            {overview.mechanics.map((mechanic) => (
              <Link
                className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 transition hover:-translate-y-0.5 hover:bg-[color:var(--surface-elevated)]"
                href={`/payroll?mechanicId=${mechanic.id}`}
                key={mechanic.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{mechanic.name}</p>
                    <p className="text-sm text-[color:var(--muted)]">{mechanic.email}</p>
                  </div>
                  <p className="font-heading text-lg font-semibold">
                    {formatCurrency(mechanic.totalPaid)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-[color:var(--border)] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold">Historial de pagos</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Filtra por mecanico para revisar su historial.
            </p>
          </div>

          <form className="flex gap-2" method="get">
            <Select
              className="min-w-[220px]"
              defaultValue={overview.selectedMechanicId}
              name="mechanicId"
            >
              <option value="">Todos los mecanicos</option>
              {overview.mechanics.map((mechanic) => (
                <option key={mechanic.id} value={mechanic.id}>
                  {mechanic.name}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </form>
        </div>

        <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] px-6 py-3 text-sm font-semibold text-[color:var(--muted-strong)] lg:grid">
          <span>Mecanico</span>
          <span>Concepto</span>
          <span>Monto</span>
          <span>Fecha</span>
          <span>Registrado por</span>
        </div>

        <div className="divide-y divide-[color:var(--border)]">
          {overview.payments.map((payment) => (
            <div
              className="grid gap-3 px-6 py-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr] lg:items-center"
              key={payment.id}
            >
              <div>
                <p className="font-semibold text-[color:var(--foreground)]">
                  {payment.mechanic.name}
                </p>
                <p className="text-sm text-[color:var(--muted)]">{payment.mechanic.email}</p>
              </div>
              <Badge tone={payment.concept === "ADVANCE" ? "warning" : "info"}>
                {MECHANIC_PAYMENT_CONCEPT_LABELS[payment.concept]}
              </Badge>
              <p className="font-heading text-lg font-semibold">{formatCurrency(payment.amount)}</p>
              <p className="text-sm text-[color:var(--muted-strong)]">{formatDate(payment.paidAt)}</p>
              <div>
                <p className="text-sm text-[color:var(--muted-strong)]">{payment.issuedBy.name}</p>
                {payment.note ? (
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{payment.note}</p>
                ) : null}
              </div>
            </div>
          ))}

          {overview.payments.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[color:var(--muted)]">
              No hay pagos registrados con este filtro.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[var(--radius-card)] px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
        {value}
      </p>
    </Card>
  );
}
