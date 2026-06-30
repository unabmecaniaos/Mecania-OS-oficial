"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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

const formSchema = z.object({
  customerVehicle: z.object({
    fullName: z.string().min(1, "El nombre es obligatorio"),
    phone: z.string().min(1, "El teléfono es obligatorio"),
    email: z.string().email("Correo electrónico inválido"),
    plate: z.string().min(1, "La patente es obligatoria"),
    vin: z.string().optional(),
    year: z.string().min(4, "Año inválido"),
    make: z.string().min(1, "La marca es obligatoria"),
    model: z.string().min(1, "El modelo es obligatorio"),
    mileage: z.string().min(1, "Kilometraje inválido"),
  }),
  problem: z.object({
    problemType: z.string().min(1, "Selecciona el tipo de problema"),
    vehicleStarts: z.boolean(),
    canDrive: z.boolean(),
    warningLights: z.boolean(),
    problemSince: z.string().min(1, "Selecciona desde cuándo"),
    issueFrequency: z.string().min(1, "Selecciona la frecuencia"),
    description: z.string().min(1, "Descripción obligatoria"),
  }),
  evidence: z.object({
    finalComment: z.string().optional(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerVehicle: {
        fullName: initialData.form.customerVehicle.fullName || "",
        phone: initialData.form.customerVehicle.phone || "",
        email: initialData.form.customerVehicle.email || "",
        plate: initialData.form.customerVehicle.plate || "",
        vin: initialData.form.customerVehicle.vin || "",
        year: String(initialData.form.customerVehicle.year || "2015"),
        make: initialData.form.customerVehicle.make || "",
        model: initialData.form.customerVehicle.model || "",
        mileage: String(initialData.form.customerVehicle.mileage || "0"),
      },
      problem: {
        problemType: initialData.form.problem.problemType || "",
        vehicleStarts: initialData.form.problem.vehicleStarts ?? true,
        canDrive: initialData.form.problem.canDrive ?? true,
        warningLights: initialData.form.problem.warningLights ?? false,
        problemSince: initialData.form.problem.problemSince || "",
        issueFrequency: initialData.form.problem.issueFrequency || "",
        description: initialData.form.problem.description || "",
      },
      evidence: {
        finalComment: initialData.form.evidence.finalComment || "",
      },
    },
  });

  // Extract deeply nested hook form errors into a flat array of strings
  useEffect(() => {
    const flatErrors: string[] = [];
    const traverse = (obj: any, path: string = "") => {
      for (const key in obj) {
        if (obj[key] && obj[key].message) {
          flatErrors.push(obj[key].message);
        } else if (typeof obj[key] === "object") {
          traverse(obj[key], path ? `${path}.${key}` : key);
        }
      }
    };
    traverse(errors);
    
    if (flatErrors.length > 0) {
      setErrorMessages(flatErrors);
      // Auto smooth scroll to top of the errors
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setErrorMessages([]);
    }
  }, [errors]);

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

  const onSubmit = async (values: FormValues) => {
    setErrorMessages([]);
    setIsSubmitting(true);

    try {
      // 1. Save vehicle
      await requestJson(`/api/self-inspections/public/${token}/vehicle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values.customerVehicle),
      });

      // 2. Save problem (this might update required photos on the backend)
      const dataAfterReason = await requestJson<PublicSelfInspectionWizardData>(
        `/api/self-inspections/public/${token}/reason`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values.problem),
        },
      );
      
      setData(dataAfterReason);

      // Check if there are missing photos before attempting to submit
      if (dataAfterReason.missingRequiredPhotoTypes.length > 0) {
        throw new RequestError("Faltan fotos obligatorias por subir.", []);
      }

      // 3. Submit final inspection
      const nextData = await requestJson<PublicSelfInspectionWizardData>(
        `/api/self-inspections/public/${token}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            finalComment: values.evidence.finalComment,
          }),
        },
      );

      setData(nextData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setErrorMessages(getErrorMessages(submitError));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReadOnly) {
    return (
      <div className="space-y-6">
        <Card className="rounded-[32px] border-[rgba(14,79,82,0.14)] bg-[linear-gradient(180deg,rgba(240,248,246,0.96),rgba(255,255,255,0.96))]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Enviado
            </p>
            <h2 className="font-heading text-3xl font-semibold">Autoinspección enviada</h2>
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
                Imágenes cargadas
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
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="sticky top-0 z-50 rounded-b-[24px] bg-white/80 pb-4 pt-2 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-2">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <SelfInspectionStatusBadge status={data.inspection.status} />
              <p className="rounded-full bg-[rgba(14,79,82,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--success)]">
                Tiempo estimado 2 a 3 min
              </p>
            </div>
            <p className="mt-2 text-sm font-medium text-[color:var(--muted-strong)]">
              {data.customer.fullName}
            </p>
          </div>
          <div>
            <Button
              disabled={isSubmitting || uploadingPhotoType !== null}
              type="submit"
              className="w-full lg:w-auto"
            >
              {isSubmitting ? "Guardando y enviando..." : "Guardar y Enviar Autoinspección"}
            </Button>
          </div>
        </div>
      </div>

      {errorMessages.length > 0 ? (
        <Card className="rounded-[28px] border-[rgba(200,92,42,0.18)] bg-[rgba(200,92,42,0.08)]">
          <p className="text-sm font-semibold text-[color:var(--accent-strong)]">
            Revisa estos campos antes de continuar:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--accent-strong)]">
            {errorMessages.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="rounded-[32px]">
        <div className="space-y-3">
          <h2 className="font-heading text-3xl font-semibold">Tus datos y tu vehículo</h2>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <QuestionField label="Nombre completo">
            <Input {...register("customerVehicle.fullName")} />
          </QuestionField>
          <QuestionField label="Teléfono">
            <Input {...register("customerVehicle.phone")} />
          </QuestionField>
          <QuestionField className="md:col-span-2" label="Correo">
            <Input type="email" {...register("customerVehicle.email")} />
          </QuestionField>
          <QuestionField label="Patente">
            <Input {...register("customerVehicle.plate")} />
          </QuestionField>
          <QuestionField label="VIN">
            <Input {...register("customerVehicle.vin")} />
          </QuestionField>
          <QuestionField label="Año">
            <Input type="number" {...register("customerVehicle.year")} />
          </QuestionField>
          <QuestionField label="Marca">
            <Input {...register("customerVehicle.make")} />
          </QuestionField>
          <QuestionField label="Modelo">
            <Input {...register("customerVehicle.model")} />
          </QuestionField>
          <QuestionField className="md:col-span-2" label="Kilometraje aproximado">
            <Input type="number" {...register("customerVehicle.mileage")} />
          </QuestionField>
        </div>
      </Card>

      <Card className="rounded-[32px]">
        <div className="space-y-3">
          <h2 className="font-heading text-3xl font-semibold">Cuéntanos qué está pasando</h2>
        </div>

        <div className="mt-6 space-y-5">
          <QuestionField label="Tipo de problema">
            <Controller
              name="problem.problemType"
              control={control}
              render={({ field }) => (
                <ChoiceSegmentField
                  columns={3}
                  options={SELF_INSPECTION_PROBLEM_TYPE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </QuestionField>

          <div className="grid gap-5 md:grid-cols-3">
            <QuestionField label="El vehículo enciende">
              <Controller
                name="problem.vehicleStarts"
                control={control}
                render={({ field }) => (
                  <BooleanSegmentField value={field.value} onChange={field.onChange} />
                )}
              />
            </QuestionField>
            <QuestionField label="Se puede conducir normalmente">
              <Controller
                name="problem.canDrive"
                control={control}
                render={({ field }) => (
                  <BooleanSegmentField value={field.value} onChange={field.onChange} />
                )}
              />
            </QuestionField>
            <QuestionField label="Hay luces de advertencia encendidas">
              <Controller
                name="problem.warningLights"
                control={control}
                render={({ field }) => (
                  <BooleanSegmentField value={field.value} onChange={field.onChange} />
                )}
              />
            </QuestionField>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <QuestionField label="Desde cuándo comenzó el problema">
              <Controller
                name="problem.problemSince"
                control={control}
                render={({ field }) => (
                  <ChoiceSegmentField
                    options={SELF_INSPECTION_PROBLEM_SINCE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </QuestionField>
            <QuestionField label="El problema es constante o intermitente">
              <Controller
                name="problem.issueFrequency"
                control={control}
                render={({ field }) => (
                  <ChoiceSegmentField
                    options={SELF_INSPECTION_PROBLEM_FREQUENCY_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </QuestionField>
          </div>

          <QuestionField label="Descripción breve del problema">
            <Textarea rows={5} {...register("problem.description")} />
          </QuestionField>
        </div>
      </Card>

      <Card className="rounded-[32px]">
        <div className="space-y-3">
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
            <Textarea rows={4} {...register("evidence.finalComment")} />
          </QuestionField>
        </div>

        {data.missingRequiredPhotoTypes.length > 0 ? (
          <div className="mt-5 rounded-[20px] border border-[rgba(200,92,42,0.18)] bg-[rgba(200,92,42,0.08)] px-4 py-3 text-sm text-[color:var(--accent-strong)]">
            Falta al menos la imagen principal del problema:{" "}
            {data.missingRequiredPhotoTypes
              .map((photoType) => SELF_INSPECTION_PHOTO_TYPE_LABELS[photoType])
              .join(", ")}
          </div>
        ) : null}
      </Card>
      
      {/* Bottom padding for mobile so sticky header doesn't hide content */}
      <div className="h-10" />
    </form>
  );
}
