import { BudgetStatus, UserRole, WorkOrderStatus } from "@prisma/client";

import { AppError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { readStorageObject } from "@/lib/supabase-storage";
import { parseDateInput } from "@/lib/utils";
import { requireApiUser } from "@/modules/auth/auth.service";
import {
  InsuranceCaseDetailRecord,
  InsuranceCaseListRecord,
  insuranceCaseRepository,
} from "@/modules/insurance-cases/insurance-case.repository";
import { createInsuranceCaseSchema } from "@/modules/insurance-cases/insurance-case.schemas";
import { saveInsuranceCasePhotoFile } from "@/modules/insurance-cases/insurance-case.storage";
import {
  getWorkOrderAutomaticProgressPercent,
  isClosedStatus,
} from "@/modules/work-orders/work-order.constants";

export const INSURANCE_CASE_STAGE_LABELS = {
  INGRESADO: "Ingresado",
  PRESUPUESTADO: "Presupuestado",
  EN_REPARACION: "En reparacion",
  LISTO: "Listo",
} as const;

export type InsuranceCaseStage = keyof typeof INSURANCE_CASE_STAGE_LABELS;

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfToday(start: Date) {
  const value = new Date(start);
  value.setDate(value.getDate() + 1);
  return value;
}

async function createInsuranceCaseNumber() {
  const start = startOfToday();
  const end = endOfToday(start);
  const count = await insuranceCaseRepository.countCreatedToday(start, end);
  const stamp = start.toISOString().slice(0, 10).replace(/-/g, "");

  return `SIN-${stamp}-${String(count + 1).padStart(3, "0")}`;
}

function getCurrentOrLatestWorkOrder<T extends { status: WorkOrderStatus }>(workOrders: T[]) {
  return workOrders.find((workOrder) => !isClosedStatus(workOrder.status)) ?? workOrders[0] ?? null;
}

function resolveInsuranceCaseStage(input: {
  latestBudget: { status: BudgetStatus } | null;
  currentWorkOrder: { status: WorkOrderStatus } | null;
}) {
  if (
    input.currentWorkOrder &&
    (input.currentWorkOrder.status === WorkOrderStatus.READY_FOR_DELIVERY ||
      input.currentWorkOrder.status === WorkOrderStatus.DELIVERED)
  ) {
    return "LISTO" as const;
  }

  if (input.currentWorkOrder) {
    return "EN_REPARACION" as const;
  }

  if (input.latestBudget) {
    return "PRESUPUESTADO" as const;
  }

  return "INGRESADO" as const;
}

function summarizeInsuranceCaseList(record: InsuranceCaseListRecord) {
  const latestBudget = record.budgets[0] ?? null;
  const currentWorkOrder =
    latestBudget?.workOrder ?? getCurrentOrLatestWorkOrder(record.workOrders);
  const stage = resolveInsuranceCaseStage({
    latestBudget,
    currentWorkOrder,
  });

  return {
    ...record,
    latestBudget,
    currentWorkOrder,
    stage,
    stageLabel: INSURANCE_CASE_STAGE_LABELS[stage],
    progressPercent: currentWorkOrder
      ? getWorkOrderAutomaticProgressPercent({
          status: currentWorkOrder.status,
          tasks: currentWorkOrder.tasks,
        })
      : 0,
    hasPendingBudgetDecision: latestBudget?.status === BudgetStatus.SENT,
    readyForDelivery:
      currentWorkOrder?.status === WorkOrderStatus.READY_FOR_DELIVERY ||
      currentWorkOrder?.status === WorkOrderStatus.DELIVERED,
  };
}

function summarizeInsuranceCaseDetail(record: InsuranceCaseDetailRecord) {
  const latestBudget = record.budgets[0] ?? null;
  const currentWorkOrder =
    latestBudget?.workOrder ?? getCurrentOrLatestWorkOrder(record.workOrders);
  const stage = resolveInsuranceCaseStage({
    latestBudget,
    currentWorkOrder,
  });

  return {
    ...record,
    latestBudget,
    currentWorkOrder,
    stage,
    stageLabel: INSURANCE_CASE_STAGE_LABELS[stage],
    progressPercent: currentWorkOrder
      ? getWorkOrderAutomaticProgressPercent({
          status: currentWorkOrder.status,
          tasks: currentWorkOrder.tasks,
        })
      : 0,
    hasPendingBudgetDecision: latestBudget?.status === BudgetStatus.SENT,
    readyForDelivery:
      currentWorkOrder?.status === WorkOrderStatus.READY_FOR_DELIVERY ||
      currentWorkOrder?.status === WorkOrderStatus.DELIVERED,
  };
}

async function findVehicleForClaim(input: { vin: string; plate?: string | null }) {
  const normalizedVin = input.vin.trim().toUpperCase();
  const normalizedPlate = input.plate?.trim().toUpperCase();

  return prisma.vehicle.findFirst({
    where: {
      deletedAt: null,
      OR: [
        {
          vin: normalizedVin,
        },
        normalizedPlate
          ? {
              plate: normalizedPlate,
            }
          : undefined,
      ].filter(Boolean) as Array<{ vin?: string; plate?: string }>,
    },
    select: {
      id: true,
      clientId: true,
    },
  });
}

async function createClaimClientAndVehicle(input: {
  liquidatorName: string;
  ownerPhone: string;
  ownerEmail?: string;
  ownerAddress?: string;
  existingVehicleId?: string;
  plate?: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  color?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        fullName: `Titular resguardado por ${input.liquidatorName}`,
        phone: input.ownerPhone,
        email:
          input.ownerEmail?.toLowerCase() ??
          `claim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@mecaniaos.local`,
        address: input.ownerAddress,
        isWorkshopClient: false,
      },
    });

    if (input.existingVehicleId) {
      return {
        id: input.existingVehicleId,
        clientId: client.id,
      };
    }

    const vehicle = await tx.vehicle.create({
      data: {
        clientId: client.id,
        plate: input.plate?.trim().toUpperCase() || null,
        vin: input.vin.trim().toUpperCase(),
        make: input.make,
        model: input.model,
        year: input.year,
        color: input.color,
      },
      select: {
        id: true,
        clientId: true,
      },
    });

    return vehicle;
  });
}

export async function findLatestInsuranceCaseLink(clientId: string, vehicleId: string) {
  return insuranceCaseRepository.findLatestByClientVehicle(clientId, vehicleId);
}

export async function createInsuranceCaseByLiquidator(
  input: unknown,
  files: File[],
  liquidatorId: string,
) {
  const data = createInsuranceCaseSchema.parse(input);

  if (files.length === 0) {
    throw new AppError(
      "Debes adjuntar al menos una foto inicial del siniestro para enviar la solicitud.",
      422,
    );
  }

  const liquidator = await prisma.user.findUnique({
    where: {
      id: liquidatorId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!liquidator) {
    throw new NotFoundError("Liquidador no encontrado");
  }

  const existingVehicle = await findVehicleForClaim({
    vin: data.vin,
    plate: data.plate,
  });
  const vehicleLink =
    await createClaimClientAndVehicle({
      liquidatorName: liquidator.name,
      ownerPhone: data.ownerPhone,
      ownerEmail: data.ownerEmail,
      ownerAddress: data.ownerAddress,
      existingVehicleId: existingVehicle?.id,
      plate: data.plate ?? undefined,
      vin: data.vin,
      make: data.make,
      model: data.model,
      year: data.year,
      color: data.color ?? undefined,
    });
  const matchingCase = await insuranceCaseRepository.findLatestByVehicle(vehicleLink.id);

  if (matchingCase && matchingCase.liquidatorId !== liquidatorId) {
    throw new UnauthorizedError(
      "Este vehiculo ya tiene un caso asignado a otro liquidador. Pide al taller que lo reasigne.",
    );
  }

  const insuranceCase = await insuranceCaseRepository.create({
    caseNumber: await createInsuranceCaseNumber(),
    clientId: vehicleLink.clientId,
    vehicleId: vehicleLink.id,
    liquidatorId,
    createdFromLiquidatorPortal: true,
    ownerFullName: data.ownerFullName,
    ownerPhone: data.ownerPhone,
    ownerEmail: data.ownerEmail,
    ownerAddress: data.ownerAddress,
    claimNumber: data.claimNumber,
    policyNumber: data.policyNumber,
    incidentDate: parseDateInput(data.incidentDate) ?? new Date(),
    incidentLocation: data.incidentLocation,
    description: data.description,
  });

  const savedPhotos = [];

  for (const file of files) {
    const saved = await saveInsuranceCasePhotoFile({
      insuranceCaseId: insuranceCase.id,
      file,
    });

    savedPhotos.push(saved);
  }

  return insuranceCaseRepository.createPhotos(
    insuranceCase.id,
    savedPhotos.map((photo) => ({
      fileUrl: photo.fileUrl,
      storageKey: photo.storageKey,
      fileName: photo.fileName,
      mimeType: photo.mimeType,
      sizeBytes: photo.sizeBytes,
    })),
  );
}

export async function listInternalInsuranceCases(search?: string) {
  const cases = await insuranceCaseRepository.listForInternal(search?.trim());
  return cases.map(summarizeInsuranceCaseList);
}

export async function getInternalInsuranceCaseDetail(id: string) {
  const insuranceCase = await insuranceCaseRepository.findByIdForInternal(id);

  if (!insuranceCase) {
    throw new NotFoundError("Caso de seguro no encontrado");
  }

  return summarizeInsuranceCaseDetail(insuranceCase);
}

export async function getLiquidatorPortalOverview() {
  const session = await requireApiUser([UserRole.LIQUIDATOR]);
  const cases = (await insuranceCaseRepository.listForLiquidator(session.user.id)).map(
    summarizeInsuranceCaseList,
  );

  return {
    liquidator: session.user,
    cases,
    stats: {
      totalCases: cases.length,
      pendingBudgets: cases.filter((insuranceCase) => insuranceCase.hasPendingBudgetDecision)
        .length,
      activeRepairs: cases.filter(
        (insuranceCase) =>
          insuranceCase.currentWorkOrder &&
          insuranceCase.currentWorkOrder.status !== WorkOrderStatus.READY_FOR_DELIVERY &&
          insuranceCase.currentWorkOrder.status !== WorkOrderStatus.DELIVERED &&
          insuranceCase.currentWorkOrder.status !== WorkOrderStatus.CANCELLED,
      ).length,
      readyCases: cases.filter((insuranceCase) => insuranceCase.readyForDelivery).length,
    },
  };
}

export async function getLiquidatorInsuranceCaseDetail(id: string) {
  const session = await requireApiUser([UserRole.LIQUIDATOR]);
  const insuranceCase = await insuranceCaseRepository.findByIdForLiquidator(id, session.user.id);

  if (!insuranceCase) {
    throw new NotFoundError("Caso de seguro no encontrado");
  }

  return summarizeInsuranceCaseDetail(insuranceCase);
}

export async function getInsuranceCasePhotoFile(photoId: string) {
  const session = await requireApiUser([UserRole.ADMIN, UserRole.MECHANIC, UserRole.LIQUIDATOR]);
  const photo = await insuranceCaseRepository.findPhotoById(photoId);

  if (!photo) {
    throw new NotFoundError("Foto del siniestro no encontrada");
  }

  if (
    session.user.role === UserRole.LIQUIDATOR &&
    photo.insuranceCase.liquidatorId !== session.user.id
  ) {
    throw new ForbiddenError();
  }

  if (!env.SUPABASE_STORAGE_BUCKET_SELF_INSPECTIONS) {
    throw new AppError("El almacenamiento de fotos no esta configurado.", 500);
  }

  const body = await readStorageObject(
    env.SUPABASE_STORAGE_BUCKET_SELF_INSPECTIONS,
    photo.storageKey,
  );

  return {
    body,
    fileName: photo.fileName,
    mimeType: photo.mimeType,
  };
}

export async function respondToInsuranceBudget(
  budgetId: string,
  input: {
    nextStatus: BudgetStatus;
    note?: string;
  },
) {
  const session = await requireApiUser([UserRole.LIQUIDATOR]);
  const budget = await insuranceCaseRepository.findBudgetForLiquidator(budgetId, session.user.id);

  if (!budget || !budget.insuranceCase) {
    throw new NotFoundError("Presupuesto de aseguradora no encontrado");
  }

  if (budget.status !== BudgetStatus.SENT) {
    throw new AppError("Este presupuesto ya no admite respuesta del liquidador", 422);
  }

  return insuranceCaseRepository.transitionBudgetForLiquidator({
    budgetId: budget.id,
    previousStatus: budget.status,
    nextStatus: input.nextStatus,
    note: input.note?.trim() || undefined,
    changedById: session.user.id,
    changedAt: new Date(),
  });
}
