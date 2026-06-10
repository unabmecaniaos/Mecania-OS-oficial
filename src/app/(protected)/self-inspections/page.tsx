import Link from "next/link";

import { InviteForm } from "@/app/(protected)/self-inspections/invite-form";
import { SelfInspectionRiskBadge } from "@/components/self-inspections/self-inspection-risk-badge";
import { SelfInspectionStatusBadge } from "@/components/self-inspections/self-inspection-status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import {
  SELF_INSPECTION_RISK_OPTIONS,
  SELF_INSPECTION_STATUS_OPTIONS,
} from "@/modules/self-inspections/self-inspection.constants";
import { listSelfInspections } from "@/modules/self-inspections/self-inspection.service";

type SelfInspectionsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    risk?: string;
  }>;
};

export default async function SelfInspectionsPage({ searchParams }: SelfInspectionsPageProps) {
  const { q, status, risk } = await searchParams;
  const inspections = await listSelfInspections({
    q,
    status,
    risk,
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[color:var(--foreground)]">
            Autoinspecciones del vehiculo
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Revisa solicitudes de clientes, riesgos detectados y evidencia recibida.
          </p>
        </div>
      </section>

      <Card className="rounded-[22px] bg-white">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px_auto]" method="get">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Buscar
              </label>
              <Input defaultValue={q} name="q" placeholder="Buscar por cliente, patente o VIN" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Estado
              </label>
              <Select defaultValue={status ?? ""} name="status">
                <option value="">Todos los estados</option>
                {SELF_INSPECTION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Riesgo
              </label>
              <Select defaultValue={risk ?? ""} name="risk">
                <option value="">Todos los riesgos</option>
                {SELF_INSPECTION_RISK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full md:w-auto" type="submit" variant="secondary">
                Filtrar
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end xl:justify-end">
            <div className="rounded-xl border border-[#d7e0ec] bg-[#f8fbff] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Autoinspecciones recibidas
              </p>
              <p className="mt-2 font-heading text-2xl font-semibold text-[color:var(--foreground)]">
                {inspections.length}
              </p>
            </div>
            <InviteForm />
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="space-y-3">
          {inspections.map((inspection) => (
            <Card
              className="rounded-xl border border-[rgba(37,99,235,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,250,255,0.98)_100%)] px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.045)]"
              key={inspection.id}
            >
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1.7fr_0.78fr] lg:items-start lg:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[rgba(37,99,235,0.16)] bg-[rgba(37,99,235,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
                      Recepcion
                    </span>
                    <SelfInspectionStatusBadge status={inspection.status} />
                    <SelfInspectionRiskBadge level={inspection.overallRiskLevel} />
                  </div>

                  <h3 className="mt-2.5 font-heading text-lg font-semibold text-[color:var(--foreground)] lg:text-[1.45rem]">
                    {inspection.vehicleSnapshot?.make ?? inspection.vehicle?.make ?? "Vehiculo"}{" "}
                    {inspection.vehicleSnapshot?.model ?? inspection.vehicle?.model ?? ""}
                  </h3>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-[color:var(--muted-strong)] lg:text-sm">
                    <span>{inspection.customer.fullName}</span>
                    <span className="text-[color:var(--border-strong)]">/</span>
                    <span>
                      {inspection.vehicleSnapshot?.plate ?? inspection.vehicle?.plate ?? "Sin patente"}
                    </span>
                    <span className="text-[color:var(--border-strong)]">/</span>
                    <span>Inicio {formatDate(inspection.startedAt)}</span>
                  </div>

                  <p className="mt-2.5 max-w-3xl text-[13px] leading-5 text-[color:var(--muted)] lg:text-sm">
                    {inspection.mainComplaint ?? "Sin motivo principal definido"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="rounded-xl border border-[color:var(--border)] bg-white/85 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                        Fotos
                      </p>
                      <p className="mt-0.5 font-heading text-base font-semibold">
                        {inspection._count.photos}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[color:var(--border)] bg-white/85 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                        Respuestas
                      </p>
                      <p className="mt-0.5 font-heading text-base font-semibold">
                        {inspection._count.answers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 rounded-xl border border-[rgba(37,99,235,0.12)] bg-white/88 px-4 py-3 lg:max-w-[320px] lg:justify-self-end">
                  <p className="text-[13px] font-medium text-[color:var(--muted-strong)] lg:text-sm">
                    Seguimiento
                  </p>
                  {inspection.criticalFindings.length > 0 ? (
                    <div className="rounded-lg border border-[rgba(180,83,9,0.18)] bg-[rgba(245,158,11,0.08)] px-3 py-2 text-[13px] leading-5 text-[#9a3412] lg:text-sm">
                      <span className="font-semibold uppercase tracking-[0.14em]">Alertas</span>
                      <p className="mt-1">
                        {inspection.criticalFindings
                          .slice(0, 3)
                          .map((finding) => finding.label)
                          .join(", ")}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[rgba(22,163,74,0.16)] bg-[rgba(22,163,74,0.08)] px-3 py-2 text-[13px] leading-5 text-[#166534] lg:text-sm">
                      Sin alertas criticas destacadas en este caso.
                    </div>
                  )}

                  <Link href={`/self-inspections/${inspection.id}`}>
                    <Button className="w-full">Abrir inspeccion</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}

          {inspections.length === 0 ? (
            <Card className="rounded-[28px] text-center">
              <p className="text-[color:var(--muted-strong)]">
                No hay autoinspecciones con esos filtros.
              </p>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
