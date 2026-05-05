import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { PublicLinkPanel } from "@/app/(protected)/self-inspections/public-link-panel";
import { ReviewForm } from "@/app/(protected)/self-inspections/review-form";
import { SelfInspectionStatusForm } from "@/app/(protected)/self-inspections/status-form";
import { SelfInspectionRiskBadge } from "@/components/self-inspections/self-inspection-risk-badge";
import { SelfInspectionStatusBadge } from "@/components/self-inspections/self-inspection-status-badge";
import { Card } from "@/components/ui/card";
import { normalizeError } from "@/lib/errors";
import { env } from "@/lib/env";
import { formatDateTime } from "@/lib/utils";
import {
  SELF_INSPECTION_DEPARTMENT_LABELS,
  SELF_INSPECTION_NEXT_STEP_LABELS,
  SELF_INSPECTION_PHOTO_TYPE_LABELS,
  SELF_INSPECTION_RISK_LABELS,
} from "@/modules/self-inspections/self-inspection.constants";
import { getSelfInspectionById } from "@/modules/self-inspections/self-inspection.service";

type SelfInspectionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

function stripSerializedNote(value: string) {
  return value.replace(/^\[\[(.+?)\]\]\s/, "");
}

export default async function SelfInspectionDetailPage({
  params,
  searchParams,
}: SelfInspectionDetailPageProps) {
  const [{ id }, { token }] = await Promise.all([params, searchParams]);
  const requestHeaders = await headers();
  const inspection = await getSelfInspectionById(id).catch((error) => {
    if (normalizeError(error).statusCode === 404) {
      notFound();
    }

    throw error;
  });
  const latestReview = inspection.reviews[0];
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (env.NODE_ENV === "production" ? "https" : "http");
  const appOrigin = host ? `${protocol}://${host}` : env.APP_URL;
  const publicUrl = token ? `${appOrigin}/self-inspections/start/${token}` : null;

  return (
    <div className="space-y-6">
      <Card className="rounded-[32px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Autoinspeccion del vehiculo
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-semibold">
                {inspection.vehicleSnapshot?.make ?? inspection.vehicle?.make ?? "Vehiculo"}{" "}
                {inspection.vehicleSnapshot?.model ?? inspection.vehicle?.model ?? ""}
              </h1>
              <SelfInspectionStatusBadge status={inspection.status} />
              <SelfInspectionRiskBadge level={inspection.overallRiskLevel} />
            </div>
            <p className="mt-3 text-sm text-[color:var(--muted-strong)]">
              {inspection.customer.fullName} /{" "}
              {inspection.vehicleSnapshot?.plate ?? inspection.vehicle?.plate ?? "Sin patente"}
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {inspection.mainComplaint ?? "Sin motivo principal definido"}
            </p>
          </div>

          {publicUrl ? <PublicLinkPanel publicUrl={publicUrl} /> : null}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card className="rounded-[32px]">
            <h2 className="font-heading text-2xl font-semibold">Resumen automatico</h2>
            {inspection.summaryGenerated ? (
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted-strong)]">
                {inspection.summaryGenerated}
              </p>
            ) : null}

            <div className="mt-5 data-grid">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Inicio
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {formatDateTime(inspection.startedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Envio
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {formatDateTime(inspection.submittedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Kilometraje
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {inspection.vehicleSnapshot?.mileage?.toLocaleString("es-CL") ?? "-"} km
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Puede circular
                </p>
                <p className="mt-2 text-sm text-[color:var(--foreground)]">
                  {inspection.canDrive ? "Si" : inspection.canDrive === false ? "No" : "-"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[32px]">
            <h2 className="font-heading text-2xl font-semibold">Alertas criticas</h2>
            <div className="mt-5 space-y-3">
              {inspection.criticalFindings.length > 0 ? (
                inspection.criticalFindings.map((finding, index) => (
                  <div
                    className="rounded-[22px] border border-[rgba(200,92,42,0.18)] bg-[rgba(200,92,42,0.08)] px-4 py-3"
                    key={`${finding.label}-${index}`}
                  >
                    <p className="text-sm font-semibold text-[color:var(--accent-strong)]">
                      {finding.label}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--muted-strong)]">
                      Riesgo {SELF_INSPECTION_RISK_LABELS[finding.severity]}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  No hay respuestas criticas destacadas.
                </p>
              )}
            </div>
          </Card>

          <Card className="rounded-[32px]">
            <h2 className="font-heading text-2xl font-semibold">Estado y revision</h2>
            <div className="mt-5 space-y-6">
              <SelfInspectionStatusForm currentStatus={inspection.status} inspectionId={inspection.id} />
              <ReviewForm inspectionId={inspection.id} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[32px]">
            <h2 className="font-heading text-2xl font-semibold">Galeria fotografica</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {inspection.photos.map((photo) => (
                <div
                  className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-3"
                  key={photo.id}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={SELF_INSPECTION_PHOTO_TYPE_LABELS[photo.photoType]}
                    className="h-44 w-full rounded-[20px] object-cover"
                    src={photo.fileUrl}
                  />
                  <p className="mt-3 text-sm font-semibold text-[color:var(--foreground)]">
                    {SELF_INSPECTION_PHOTO_TYPE_LABELS[photo.photoType]}
                  </p>
                  {photo.comment ? (
                    <p className="mt-1 text-xs text-[color:var(--muted-strong)]">{photo.comment}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[32px]">
            <h2 className="font-heading text-2xl font-semibold">Respuestas estructuradas</h2>
            <div className="mt-5 space-y-5">
              {inspection.groupedAnswers
                .filter((group) => group.answers.length > 0)
                .map((group) => (
                  <div key={group.key}>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {group.label}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {group.answers.map((answer) => (
                        <div
                          className="rounded-[22px] border border-[color:var(--border)] bg-white/70 px-4 py-3"
                          key={answer.id}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[color:var(--foreground)]">
                              {answer.questionLabel}
                            </p>
                            {answer.severity ? (
                              <SelfInspectionRiskBadge level={answer.severity} />
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-[color:var(--muted-strong)]">
                            {Array.isArray(answer.answerValue)
                              ? answer.answerValue.join(", ")
                              : String(answer.answerValue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card className="rounded-[32px]">
            <h2 className="font-heading text-2xl font-semibold">Notas y trazabilidad</h2>
            <div className="mt-5 space-y-4">
              {inspection.notes.map((note) => (
                <div
                  className="rounded-[22px] border border-[color:var(--border)] bg-white/70 p-4"
                  key={note.id}
                >
                  <p className="text-sm text-[color:var(--muted-strong)]">
                    {stripSerializedNote(note.content)}
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">
                    {formatDateTime(note.createdAt)}
                  </p>
                </div>
              ))}

              {latestReview ? (
                <div className="rounded-[24px] border border-[rgba(14,79,82,0.16)] bg-[rgba(14,79,82,0.08)] p-4">
                  <p className="font-semibold text-[color:var(--success)]">
                    Ultima revision interna
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                    {latestReview.internalSummary}
                  </p>
                  <p className="mt-3 text-xs text-[color:var(--muted)]">
                    {latestReview.reviewedBy.name} / {formatDateTime(latestReview.reviewedAt)}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    Siguiente paso: {SELF_INSPECTION_NEXT_STEP_LABELS[latestReview.recommendedNextStep]}
                  </p>
                  {latestReview.departmentSuggestion ? (
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      Derivacion: {SELF_INSPECTION_DEPARTMENT_LABELS[latestReview.departmentSuggestion]}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-3">
                {inspection.statusLogs.map((log) => (
                  <div
                    className="rounded-[22px] border border-[color:var(--border)] bg-white/70 p-4"
                    key={log.id}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <SelfInspectionStatusBadge status={log.nextStatus} />
                      <p className="text-sm text-[color:var(--muted-strong)]">{log.note ?? "Sin nota"}</p>
                    </div>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      {log.changedBy?.name ?? "Sistema"} / {formatDateTime(log.changedAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
