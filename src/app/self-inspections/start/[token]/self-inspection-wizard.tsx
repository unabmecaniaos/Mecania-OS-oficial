"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BooleanSegmentField } from "@/components/self-inspections/boolean-segment-field";
import { ChoiceSegmentField } from "@/components/self-inspections/choice-segment-field";
import { PhotoSlotCard } from "@/components/self-inspections/photo-slot-card";
import { QuestionField } from "@/components/self-inspections/question-field";
import { SelfInspectionStatusBadge } from "@/components/self-inspections/self-inspection-status-badge";
import { WizardProgress } from "@/components/self-inspections/wizard-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SELF_INSPECTION_PHOTO_TYPE_LABELS,
  SELF_INSPECTION_PROBLEM_FREQUENCY_OPTIONS,
  SELF_INSPECTION_PROBLEM_SINCE_OPTIONS,
  SELF_INSPECTION_PROBLEM_TYPE_OPTIONS,
} from "@/modules/self-inspections/self-inspection.constants";
import type { PublicSelfInspectionWizardData } from "@/modules/self-inspections/self-inspection.service";

type WizardProps = {
  token: string;
  initialData: PublicSelfInspectionWizardData;
};

type ApiValidationDetail = {
  path: string[];
  message: string;
};

class RequestError extends Error {
  constructor(
    message: string,
    public readonly details: ApiValidationDetail[] = [],
  ) {
    super(message);
    this.name = "RequestError";
  }
}

const validationPathLabels: Record<string, string> = {
  fullName: "nombre completo",
  phone: "telefono",
  email: "correo",
  plate: "patente",
  vin: "VIN",
  make: "marca",
  model: "modelo",
  year: "ano",
  mileage: "kilometraje",
  problemType: "tipo de problema",
  vehicleStarts: "si enciende",
  canDrive: "si se puede conducir",
  warningLights: "luces de advertencia",
  problemSince: "desde cuando comenzo",
  issueFrequency: "frecuencia del problema",
  description: "descripcion breve",
  finalComment: "comentario final",
};

function getInitialCurrentStep(data: PublicSelfInspectionWizardData) {
  if (
    data.inspection.status === "SUBMITTED" ||
    data.inspection.status === "UNDER_REVIEW" ||
    data.inspection.status === "REVIEWED" ||
    data.inspection.status === "CONVERTED_TO_WORK_ORDER"
  ) {
    return 4;
  }

  if (data.inspection.lastCompletedStep <= 0) {
    return 1;
  }

  return Math.min(data.inspection.lastCompletedStep + 1, 3);
}

function formatValidationDetail(detail: ApiValidationDetail) {
  if (detail.path.length === 0) {
    return detail.message;
  }

  const formattedPath = detail.path
    .map((segment) => validationPathLabels[segment] ?? segment)
    .join(" / ");

  return `${formattedPath}: ${detail.message}`;
}

function getErrorMessages(error: unknown) {
  if (error instanceof RequestError) {
    if (error.details.length > 0) {
      return error.details.map(formatValidationDetail);
    }

    return [error.message];
  }

  if (error instanceof Error) {
    return [error.message];
  }

  return ["No fue posible completar la solicitud"];
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json();

  if (!response.ok) {
    throw new RequestError(body.error ?? "No fue posible completar la solicitud", body.details ?? []);
  }

  return body.data as T;
}

export function SelfInspectionWizard({ token, initialData }: WizardProps) {
  const [data, setData] = useState(initialData);
  const [currentStep, setCurrentStep] = useState(getInitialCurrentStep(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotoType, setUploadingPhotoType] = useState<string | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const isReadOnly = useMemo(
    () =>
      ["SUBMITTED", "UNDER_REVIEW", "REVIEWED", "CONVERTED_TO_WORK_ORDER"].includes(
        data.inspection.status,
      ),
    [data.inspection.status],
  );

  async function saveStep(endpoint: string, payload: unknown, nextStep?: number) {
    setErrorMessages([]);
    setIsSubmitting(true);

    try {
      const nextData = await requestJson<PublicSelfInspectionWizardData>(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setData(nextData);

      if (nextStep) {
        setCurrentStep(nextStep);
      }
    } catch (saveError) {
      setErrorMessages(getErrorMessages(saveError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePhotoUpload(file: File, photoType: string) {
    setErrorMessages([]);
    setUploadingPhotoType(photoType);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("photoType", photoType);
      const slot = data.photoSlots.find((entry) => entry.photoType === photoType);
      formData.append("sortOrder", String(slot?.sortOrder ?? 0));

      const nextData = await requestJson<PublicSelfInspectionWizardData>(
        `/api/self-inspections/public/${token}/photos`,
        {
          method: "POST",
          body: formData,
        },
      );

      setData(nextData);
    } catch (uploadError) {
      setErrorMessages(getErrorMessages(uploadError));
    } finally {
      setUploadingPhotoType(null);
    }
  }

  async function handlePhotoDelete(photoId: string) {
    setErrorMessages([]);
    setUploadingPhotoType(photoId);

    try {
      const nextData = await requestJson<PublicSelfInspectionWizardData>(
        `/api/self-inspections/public/${token}/photos/${photoId}`,
        {
          method: "DELETE",
        },
      );

      setData(nextData);
    } catch (deleteError) {
      setErrorMessages(getErrorMessages(deleteError));
    } finally {
      setUploadingPhotoType(null);
    }
  }

  async function handleSubmit() {
    setErrorMessages([]);
    setIsSubmitting(true);

    try {
      const nextData = await requestJson<PublicSelfInspectionWizardData>(
        `/api/self-inspections/public/${token}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            finalComment: data.form.evidence.finalComment,
          }),
        },
      );

      setData(nextData);
      setCurrentStep(4);
    } catch (submitError) {
      setErrorMessages(getErrorMessages(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateCustomerVehicleField(field: string, value: string) {
    setData((current) => ({
      ...current,
      form: {
        ...current.form,
        customerVehicle: {
          ...current.form.customerVehicle,
          [field]: value,
        },
      },
    }));
  }

  function updateProblemField(field: string, value: unknown) {
    setData((current) => ({
      ...current,
      form: {
        ...current.form,
        problem: {
          ...current.form.problem,
          [field]: value,
        },
      },
    }));
  }

  function updateEvidenceField(value: string) {
    setData((current) => ({
      ...current,
      form: {
        ...current.form,
        evidence: {
          ...current.form.evidence,
          finalComment: value,
        },
      },
    }));
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[32px] border-[rgba(14,79,82,0.12)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <SelfInspectionStatusBadge status={data.inspection.status} />
              <p className="rounded-full bg-[rgba(14,79,82,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--success)]">
                Tiempo estimado 2 a 3 min
              </p>
            </div>
            <p className="mt-3 text-sm text-[color:var(--muted-strong)]">
              {data.customer.fullName} / {data.customer.email}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <WizardProgress
            completionPercent={data.inspection.completionPercent}
            currentStep={currentStep === 4 ? 3 : currentStep}
          />
        </div>
      </Card>

      {errorMessages.length > 0 ? (
        <Card className="rounded-[28px] border-[rgba(200,92,42,0.18)] bg-[rgba(200,92,42,0.08)]">
          <p className="text-sm font-semibold text-[color:var(--accent-strong)]">
            Revisa estos campos antes de continuar:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--accent-strong)]">
            {errorMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {currentStep === 1 ? (
        <Card className="rounded-[32px]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Paso 1 de 3
            </p>
            <h2 className="font-heading text-3xl font-semibold">Tus datos y tu vehiculo</h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <QuestionField label="Nombre completo">
              <Input
                disabled={isReadOnly}
                onChange={(event) => updateCustomerVehicleField("fullName", event.target.value)}
                value={data.form.customerVehicle.fullName}
              />
            </QuestionField>
            <QuestionField label="Telefono">
              <Input
                disabled={isReadOnly}
                onChange={(event) => updateCustomerVehicleField("phone", event.target.value)}
                value={data.form.customerVehicle.phone}
              />
            </QuestionField>
            <QuestionField className="md:col-span-2" label="Correo">
              <Input
                disabled={isReadOnly}
                onChange={(event) => updateCustomerVehicleField("email", event.target.value)}
                type="email"
                value={data.form.customerVehicle.email}
              />
            </QuestionField>
            <QuestionField label="Patente">
              <Input
                disabled={isReadOnly}
                onChange={(event) => updateCustomerVehicleField("plate", event.target.value)}
                value={data.form.customerVehicle.plate}
              />
            </QuestionField>
            <QuestionField label="VIN">
              <Input
                disabled={isReadOnly}
                onChange={(event) => updateCustomerVehicleField("vin", event.target.value)}
                value={data.form.customerVehicle.vin}
              />
            </QuestionField>
            <QuestionField label="Ano">
              <Input
                disabled={isReadOnly}
                onChange={(event) => updateCustomerVehicleField("year", event.target.value)}
                type="number"
                value={data.form.customerVehicle.year}
              />
            </QuestionField>
            <QuestionField label="Marca">
              <Input
                disabled={isReadOnly}
                onChange={(event) => updateCustomerVehicleField("make", event.target.value)}
                value={data.form.customerVehicle.make}
              />
            </QuestionField>
            <QuestionField label="Modelo">
              <Input
                disabled={isReadOnly}
                onChange={(event) => updateCustomerVehicleField("model", event.target.value)}
                value={data.form.customerVehicle.model}
              />
            </QuestionField>
            <QuestionField className="md:col-span-2" label="Kilometraje aproximado">
              <Input
                disabled={isReadOnly}
                onChange={(event) => updateCustomerVehicleField("mileage", event.target.value)}
                type="number"
                value={data.form.customerVehicle.mileage}
              />
            </QuestionField>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              disabled={isReadOnly || isSubmitting}
              onClick={() =>
                saveStep(`/api/self-inspections/public/${token}/vehicle`, data.form.customerVehicle, 2)
              }
              type="button"
            >
              Guardar y continuar
            </Button>
          </div>
        </Card>
      ) : null}

      {currentStep === 2 ? (
        <Card className="rounded-[32px]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Paso 2 de 3
            </p>
            <h2 className="font-heading text-3xl font-semibold">Cuentanos que esta pasando</h2>
          </div>

          <div className="mt-6 space-y-5">
            <QuestionField label="Tipo de problema">
              <ChoiceSegmentField
                columns={3}
                disabled={isReadOnly}
                onChange={(value) => updateProblemField("problemType", value)}
                options={SELF_INSPECTION_PROBLEM_TYPE_OPTIONS}
                value={data.form.problem.problemType}
              />
            </QuestionField>

            <div className="grid gap-5 md:grid-cols-3">
              <QuestionField label="El vehiculo enciende">
                <BooleanSegmentField
                  disabled={isReadOnly}
                  onChange={(value) => updateProblemField("vehicleStarts", value)}
                  value={data.form.problem.vehicleStarts}
                />
              </QuestionField>
              <QuestionField label="Se puede conducir normalmente">
                <BooleanSegmentField
                  disabled={isReadOnly}
                  onChange={(value) => updateProblemField("canDrive", value)}
                  value={data.form.problem.canDrive}
                />
              </QuestionField>
              <QuestionField label="Hay luces de advertencia encendidas">
                <BooleanSegmentField
                  disabled={isReadOnly}
                  onChange={(value) => updateProblemField("warningLights", value)}
                  value={data.form.problem.warningLights}
                />
              </QuestionField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <QuestionField label="Desde cuando comenzo el problema">
                <ChoiceSegmentField
                  disabled={isReadOnly}
                  onChange={(value) => updateProblemField("problemSince", value)}
                  options={SELF_INSPECTION_PROBLEM_SINCE_OPTIONS}
                  value={data.form.problem.problemSince}
                />
              </QuestionField>
              <QuestionField label="El problema es constante o intermitente">
                <ChoiceSegmentField
                  disabled={isReadOnly}
                  onChange={(value) => updateProblemField("issueFrequency", value)}
                  options={SELF_INSPECTION_PROBLEM_FREQUENCY_OPTIONS}
                  value={data.form.problem.issueFrequency}
                />
              </QuestionField>
            </div>

            <QuestionField label="Descripcion breve del problema">
              <Textarea
                disabled={isReadOnly}
                onChange={(event) => updateProblemField("description", event.target.value)}
                rows={5}
                value={data.form.problem.description}
              />
            </QuestionField>
          </div>

          <div className="mt-6 flex justify-between">
            <Button onClick={() => setCurrentStep(1)} type="button" variant="ghost">
              Volver
            </Button>
            <Button
              disabled={isReadOnly || isSubmitting}
              onClick={() =>
                saveStep(`/api/self-inspections/public/${token}/reason`, data.form.problem, 3)
              }
              type="button"
            >
              Guardar y continuar
            </Button>
          </div>
        </Card>
      ) : null}

      {currentStep === 3 ? (
        <Card className="rounded-[32px]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Paso 3 de 3
            </p>
            <h2 className="font-heading text-3xl font-semibold">Sube tu evidencia</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.photoSlots.map((slot) => (
              <PhotoSlotCard
                key={slot.photoType}
                onDelete={handlePhotoDelete}
                onUpload={handlePhotoUpload}
                photo={data.photos.find((photo) => photo.photoType === slot.photoType)}
                slot={slot}
                uploading={uploadingPhotoType === slot.photoType}
              />
            ))}
          </div>

          <div className="mt-6">
            <QuestionField label="Comentario final">
              <Textarea
                disabled={isReadOnly}
                onChange={(event) => updateEvidenceField(event.target.value)}
                rows={4}
                value={data.form.evidence.finalComment}
              />
            </QuestionField>
          </div>

          {data.missingRequiredPhotoTypes.length > 0 ? (
            <div className="mt-5 rounded-[20px] border border-[rgba(200,92,42,0.18)] bg-[rgba(200,92,42,0.08)] px-4 py-3 text-sm text-[color:var(--accent-strong)]">
              Falta al menos la imagen principal del problema:
              {" "}
              {data.missingRequiredPhotoTypes
                .map((photoType) => SELF_INSPECTION_PHOTO_TYPE_LABELS[photoType])
                .join(", ")}
            </div>
          ) : null}

          <div className="mt-6 flex justify-between">
            <Button onClick={() => setCurrentStep(2)} type="button" variant="ghost">
              Volver
            </Button>
            <Button
              disabled={isReadOnly || isSubmitting || uploadingPhotoType !== null}
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting ? "Enviando..." : "Enviar autoinspeccion"}
            </Button>
          </div>
        </Card>
      ) : null}

      {currentStep === 4 ? (
        <Card className="rounded-[32px] border-[rgba(14,79,82,0.14)] bg-[linear-gradient(180deg,rgba(240,248,246,0.96),rgba(255,255,255,0.96))]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Enviado
            </p>
            <h2 className="font-heading text-3xl font-semibold">Autoinspeccion enviada</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Estado
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                {data.inspection.statusLabel}
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Imagenes cargadas
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                {data.photos.length}
              </p>
            </div>
          </div>

          {data.inspection.summaryGenerated ? (
            <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Resumen generado
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted-strong)]">
                {data.inspection.summaryGenerated}
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex justify-start">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-transparent bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.18)] transition hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(36,88,198,0.14)]"
              href="/login"
            >
              Ir al login principal
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
