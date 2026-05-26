import {
  Prisma,
  SelfInspectionAnswerType,
  SelfInspectionNoteType,
  SelfInspectionReason,
  SelfInspectionRiskLevel,
  SelfInspectionStatus,
  UserRole,
  VehicleFuelType,
  VehicleTransmissionType,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getCurrentSession, signIn, signOut } from "@/modules/auth/auth.service";
import {
  SELF_INSPECTION_NEXT_STEP_LABELS,
  SELF_INSPECTION_OPERATIONAL_OUTCOME_LABELS,
  SELF_INSPECTION_PHOTO_SLOTS,
  SELF_INSPECTION_PHOTO_TYPE_LABELS,
  SELF_INSPECTION_PROBLEM_FREQUENCY_LABELS,
  SELF_INSPECTION_PROBLEM_SINCE_LABELS,
  SELF_INSPECTION_PROBLEM_TYPE_LABELS,
  SELF_INSPECTION_PUBLIC_QUESTION_KEYS,
  SELF_INSPECTION_QUESTION_DEFINITIONS,
  SELF_INSPECTION_REQUIRED_ANSWER_KEYS,
  SELF_INSPECTION_REQUIRED_PHOTO_TYPES,
  SELF_INSPECTION_RISK_LABELS,
  SELF_INSPECTION_SECTION_LABELS,
  SELF_INSPECTION_STATUS_LABELS,
  type SelfInspectionProblemType,
} from "@/modules/self-inspections/self-inspection.constants";
import {
  createSelfInspectionInviteSchema,
  normalizePlate,
  normalizeVin,
  publicSelfInspectionAccessSchema,
  reviewSelfInspectionSchema,
  selfInspectionFiltersSchema,
  selfInspectionPhotoUploadSchema,
  selfInspectionReasonStepSchema,
  selfInspectionVehicleStepSchema,
  submitSelfInspectionSchema,
  updateSelfInspectionStatusSchema,
  type CreateSelfInspectionInviteInput,
} from "@/modules/self-inspections/self-inspection.schemas";
import { selfInspectionRepository } from "@/modules/self-inspections/self-inspection.repository";
import {
  deleteInspectionPhotoFile,
  saveInspectionPhotoFile,
} from "@/modules/self-inspections/self-inspection.storage";
import { userRepository } from "@/modules/users/user.repository";

type AnswerRecordInput = {
  section: string;
  questionKey: string;
  questionLabel: string;
  answerType: SelfInspectionAnswerType;
  answerValue: Prisma.InputJsonValue;
  severity: SelfInspectionRiskLevel | null;
};

type AnswerMap = Record<string, unknown>;

type PublicInspectionEntity = NonNullable<
  Awaited<ReturnType<typeof selfInspectionRepository.findByAccessTokenHash>>
>;
type CustomerSession = NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>;

const FINAL_COMMENT_FIELD_KEY = "finalComment";
const FINAL_COMMENT_NOTE_TYPE = SelfInspectionNoteType.CUSTOMER_OBSERVATION;
const PENDING_SELF_INSPECTION_CLIENT_PREFIX = "SI_PENDING";
const PENDING_SELF_INSPECTION_CLIENT_NAME = "Cliente por identificar";
const PENDING_SELF_INSPECTION_EMAIL_DOMAIN = "self-inspection.pending.mecaniaos.local";

const RISK_PRIORITY: Record<SelfInspectionRiskLevel, number> = {
  [SelfInspectionRiskLevel.LOW]: 0,
  [SelfInspectionRiskLevel.MEDIUM]: 1,
  [SelfInspectionRiskLevel.HIGH]: 2,
  [SelfInspectionRiskLevel.CRITICAL]: 3,
};

function createAccessToken() {
  return randomBytes(32).toString("hex");
}

function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function createPendingClientDraft() {
  const suffix = randomBytes(10).toString("hex");

  return {
    fullName: PENDING_SELF_INSPECTION_CLIENT_NAME,
    phone: "",
    email: `pending+self-inspection-${suffix}@${PENDING_SELF_INSPECTION_EMAIL_DOMAIN}`,
    localIdentifier: `${PENDING_SELF_INSPECTION_CLIENT_PREFIX}:${suffix}`,
  };
}

function isPendingInspectionCustomer(customer: {
  email: string;
  localIdentifier?: string | null;
}) {
  return (
    customer.localIdentifier?.startsWith(PENDING_SELF_INSPECTION_CLIENT_PREFIX) === true ||
    normalizeEmail(customer.email).endsWith(`@${PENDING_SELF_INSPECTION_EMAIL_DOMAIN}`)
  );
}

function shouldMaterializeInspectionVehicle(status: SelfInspectionStatus) {
  return (
    status === SelfInspectionStatus.IN_PROGRESS ||
    status === SelfInspectionStatus.UNDER_REVIEW ||
    status === SelfInspectionStatus.REVIEWED ||
    status === SelfInspectionStatus.CONVERTED_TO_WORK_ORDER
  );
}

function getHigherRisk(
  current: SelfInspectionRiskLevel,
  next: SelfInspectionRiskLevel | null | undefined,
) {
  if (!next) {
    return current;
  }

  return RISK_PRIORITY[next] > RISK_PRIORITY[current] ? next : current;
}

function isCustomerEditableStatus(status: SelfInspectionStatus) {
  return status === SelfInspectionStatus.DRAFT || status === SelfInspectionStatus.IN_PROGRESS;
}

function serializeNoteContent(fieldKey: string, value: string) {
  return `[[${fieldKey}]] ${value}`;
}

function parseNoteContent(value: string) {
  const match = value.match(/^\[\[(.+?)\]\]\s([\s\S]*)$/);

  if (!match) {
    return {
      fieldKey: null,
      content: value,
    };
  }

  return {
    fieldKey: match[1],
    content: match[2],
  };
}

function getCompletionPercent(lastCompletedStep: number, status: SelfInspectionStatus) {
  if (
    status === SelfInspectionStatus.SUBMITTED ||
    status === SelfInspectionStatus.UNDER_REVIEW ||
    status === SelfInspectionStatus.REVIEWED ||
    status === SelfInspectionStatus.CONVERTED_TO_WORK_ORDER
  ) {
    return 100;
  }

  if (lastCompletedStep <= 0) {
    return 0;
  }

  return Math.min(95, Math.max(15, Math.round((lastCompletedStep / 3) * 100)));
}

function mapAnswersToRecord(answers: Array<{ questionKey: string; answerValue: Prisma.JsonValue }>) {
  return answers.reduce<AnswerMap>((accumulator, answer) => {
    accumulator[answer.questionKey] = answer.answerValue;
    return accumulator;
  }, {});
}

function getProblemTypeLabel(problemType: unknown) {
  if (typeof problemType !== "string") {
    return null;
  }

  return SELF_INSPECTION_PROBLEM_TYPE_LABELS[
    problemType as keyof typeof SELF_INSPECTION_PROBLEM_TYPE_LABELS
  ] ?? null;
}

function mapLegacyReasonToProblemType(reason: SelfInspectionReason | null | undefined) {
  switch (reason) {
    case SelfInspectionReason.STRANGE_NOISE:
      return "STRANGE_NOISE";
    case SelfInspectionReason.DASHBOARD_WARNING_LIGHTS:
      return "ELECTRICAL_BATTERY";
    case SelfInspectionReason.COLLISION_DAMAGE:
    case SelfInspectionReason.BODY_PAINT_DAMAGE:
      return "OTHER";
    case SelfInspectionReason.MECHANICAL_FAILURE:
      return "MOTOR";
    default:
      return "";
  }
}

function mapProblemTypeToInspectionReason(problemType: SelfInspectionProblemType) {
  switch (problemType) {
    case "STRANGE_NOISE":
      return {
        inspectionReason: SelfInspectionReason.STRANGE_NOISE,
        inspectionReasonOther: null,
      };
    case "ELECTRICAL_BATTERY":
      return {
        inspectionReason: SelfInspectionReason.DASHBOARD_WARNING_LIGHTS,
        inspectionReasonOther: "Electrico / bateria",
      };
    case "AC_HEATING":
      return {
        inspectionReason: SelfInspectionReason.OTHER,
        inspectionReasonOther: SELF_INSPECTION_PROBLEM_TYPE_LABELS[problemType],
      };
    case "OTHER":
      return {
        inspectionReason: SelfInspectionReason.OTHER,
        inspectionReasonOther: "Otro",
      };
    default:
      return {
        inspectionReason: SelfInspectionReason.MECHANICAL_FAILURE,
        inspectionReasonOther: SELF_INSPECTION_PROBLEM_TYPE_LABELS[problemType],
      };
  }
}

function buildContactSnapshot(
  customer: {
    fullName: string;
    phone: string;
    email: string;
    localIdentifier?: string | null;
  },
  answersMap: AnswerMap,
) {
  const isPendingCustomer = isPendingInspectionCustomer(customer);

  return {
    fullName: String(
      answersMap.customer_full_name ??
        (isPendingCustomer ? PENDING_SELF_INSPECTION_CLIENT_NAME : customer.fullName ?? ""),
    ),
    phone: String(answersMap.customer_phone ?? (isPendingCustomer ? "" : customer.phone ?? "")),
    email: String(answersMap.customer_email ?? (isPendingCustomer ? "" : customer.email ?? "")),
  };
}

function buildCustomerVehicleStepDraft(inspection: PublicInspectionEntity, answersMap: AnswerMap) {
  const contact = buildContactSnapshot(inspection.customer, answersMap);
  const snapshot = inspection.vehicleSnapshot;
  const vehicle = inspection.vehicle;

  return {
    fullName: contact.fullName,
    phone: contact.phone,
    email: contact.email,
    plate: String(answersMap.vehicle_plate ?? snapshot?.plate ?? vehicle?.plate ?? ""),
    vin: String(answersMap.vehicle_vin ?? snapshot?.vin ?? vehicle?.vin ?? ""),
    make: String(answersMap.vehicle_make ?? snapshot?.make ?? vehicle?.make ?? ""),
    model: String(answersMap.vehicle_model ?? snapshot?.model ?? vehicle?.model ?? ""),
    year: String(answersMap.vehicle_year ?? snapshot?.year ?? vehicle?.year ?? ""),
    mileage: String(answersMap.vehicle_mileage ?? snapshot?.mileage ?? vehicle?.mileage ?? ""),
  };
}

function buildProblemStepDraft(inspection: PublicInspectionEntity, answersMap: AnswerMap) {
  return {
    problemType: String(
      answersMap.reason_problem_type ?? mapLegacyReasonToProblemType(inspection.inspectionReason),
    ),
    vehicleStarts:
      typeof answersMap.vehicle_starts === "boolean"
        ? answersMap.vehicle_starts
        : inspection.vehicleSnapshot?.starts,
    canDrive:
      typeof answersMap.reason_can_drive === "boolean"
        ? answersMap.reason_can_drive
        : (inspection.canDrive ?? undefined),
    warningLights:
      typeof answersMap.reason_warning_lights === "boolean"
        ? answersMap.reason_warning_lights
        : undefined,
    problemSince: String(answersMap.reason_problem_since ?? ""),
    issueFrequency: String(answersMap.reason_issue_frequency ?? ""),
    description: String(answersMap.reason_problem_description ?? inspection.mainComplaint ?? ""),
  };
}

function parseCustomerNotes(notes: Array<{ noteType: SelfInspectionNoteType; content: string }>) {
  return notes.reduce(
    (accumulator, note) => {
      const parsed = parseNoteContent(note.content);

      if (parsed.fieldKey === FINAL_COMMENT_FIELD_KEY) {
        accumulator.finalComment = parsed.content;
      }

      return accumulator;
    },
    {
      finalComment: "",
    },
  );
}

function resolveAnswerSeverity(questionKey: string, answerValue: unknown) {
  switch (questionKey) {
    case "vehicle_starts":
      return answerValue === false ? SelfInspectionRiskLevel.CRITICAL : null;
    case "reason_can_drive":
      return answerValue === false ? SelfInspectionRiskLevel.CRITICAL : null;
    case "reason_warning_lights":
      return answerValue === true ? SelfInspectionRiskLevel.HIGH : null;
    case "reason_problem_type":
      switch (answerValue) {
        case "BRAKES":
        case "STEERING_SUSPENSION":
        case "ELECTRICAL_BATTERY":
        case "TRANSMISSION_CLUTCH":
        case "LEAK":
          return SelfInspectionRiskLevel.HIGH;
        case "MOTOR":
        case "AC_HEATING":
        case "STRANGE_NOISE":
        case "OTHER":
          return SelfInspectionRiskLevel.MEDIUM;
        default:
          return null;
      }
    default:
      return null;
  }
}

function buildAnswerRecord(questionKey: string, answerValue: Prisma.InputJsonValue): AnswerRecordInput {
  const definition = SELF_INSPECTION_QUESTION_DEFINITIONS[questionKey];

  if (!definition) {
    throw new AppError(`No existe definicion para la pregunta ${questionKey}`, 500);
  }

  return {
    section: definition.section,
    questionKey,
    questionLabel: definition.label,
    answerType: definition.answerType,
    answerValue,
    severity: resolveAnswerSeverity(questionKey, answerValue),
  };
}

function createCriticalFindings(input: {
  snapshot: {
    starts: boolean;
  } | null;
  canDrive: boolean | null;
  answersMap: AnswerMap;
}) {
  const findings: Array<{ label: string; severity: SelfInspectionRiskLevel }> = [];
  const starts =
    typeof input.answersMap.vehicle_starts === "boolean"
      ? input.answersMap.vehicle_starts
      : input.snapshot?.starts;

  if (starts === false) {
    findings.push({ label: "Vehiculo no enciende", severity: SelfInspectionRiskLevel.CRITICAL });
  }

  if (input.canDrive === false) {
    findings.push({
      label: "Vehiculo no se puede conducir normalmente",
      severity: SelfInspectionRiskLevel.CRITICAL,
    });
  }

  if (input.answersMap.reason_warning_lights === true) {
    findings.push({
      label: "Luces de advertencia encendidas en tablero",
      severity: SelfInspectionRiskLevel.HIGH,
    });
  }

  const problemTypeLabel = getProblemTypeLabel(input.answersMap.reason_problem_type);
  const problemTypeSeverity = resolveAnswerSeverity(
    "reason_problem_type",
    input.answersMap.reason_problem_type,
  );

  if (problemTypeLabel && problemTypeSeverity) {
    findings.push({
      label: `Problema reportado: ${problemTypeLabel}`,
      severity: problemTypeSeverity,
    });
  }

  return findings.filter(
    (finding, index, collection) =>
      collection.findIndex((candidate) => candidate.label === finding.label) === index,
  );
}

function calculateRiskLevel(input: {
  snapshot: {
    starts: boolean;
  } | null;
  canDrive: boolean | null;
  answersMap: AnswerMap;
}) {
  let overallRisk: SelfInspectionRiskLevel = SelfInspectionRiskLevel.LOW;

  if (
    input.snapshot?.starts === false ||
    input.answersMap.vehicle_starts === false ||
    input.canDrive === false
  ) {
    overallRisk = SelfInspectionRiskLevel.CRITICAL;
  }

  for (const [questionKey, answerValue] of Object.entries(input.answersMap)) {
    overallRisk = getHigherRisk(overallRisk, resolveAnswerSeverity(questionKey, answerValue));
  }

  return overallRisk;
}

function buildSummary(input: {
  contact: {
    fullName: string;
    phone: string;
    email: string;
  };
  snapshot: {
    plate: string | null;
    make: string;
    model: string;
    year: number;
    mileage: number;
    starts: boolean;
  } | null;
  canDrive: boolean | null;
  overallRiskLevel: SelfInspectionRiskLevel;
  answersMap: AnswerMap;
  photoCount: number;
  finalComment?: string;
}) {
  const problemTypeLabel =
    getProblemTypeLabel(input.answersMap.reason_problem_type) ?? "otro problema";
  const problemSince =
    SELF_INSPECTION_PROBLEM_SINCE_LABELS[
      String(input.answersMap.reason_problem_since ?? "") as keyof typeof SELF_INSPECTION_PROBLEM_SINCE_LABELS
    ] ?? null;
  const frequency =
    SELF_INSPECTION_PROBLEM_FREQUENCY_LABELS[
      String(input.answersMap.reason_issue_frequency ?? "") as keyof typeof SELF_INSPECTION_PROBLEM_FREQUENCY_LABELS
    ] ?? null;
  const description = String(input.answersMap.reason_problem_description ?? "").trim();
  const segments = [
    `${input.contact.fullName} reporta ${problemTypeLabel.toLowerCase()}${
      description ? `: ${description}.` : "."
    }`,
    input.snapshot
      ? `Vehiculo ${input.snapshot.make} ${input.snapshot.model} ${
          input.snapshot.plate ?? "sin patente"
        }, ano ${input.snapshot.year}, ${input.snapshot.mileage.toLocaleString("es-CL")} km aprox.`
      : "Vehiculo sin datos completos todavia.",
    `Contacto: ${input.contact.phone} / ${input.contact.email}.`,
    input.snapshot?.starts === false || input.answersMap.vehicle_starts === false
      ? "El cliente indica que el vehiculo no enciende."
      : "El cliente indica que el vehiculo enciende.",
    input.canDrive === false
      ? "No se puede conducir normalmente."
      : "El cliente indica que aun se puede conducir.",
    input.answersMap.reason_warning_lights === true
      ? "Hay luces de advertencia encendidas en el tablero."
      : "No reporta luces de advertencia encendidas.",
    problemSince ? `El problema comenzo ${problemSince.toLowerCase()}.` : null,
    frequency ? `El comportamiento es ${frequency.toLowerCase()}.` : null,
    `Adjunta ${input.photoCount} ${input.photoCount === 1 ? "imagen" : "imagenes"}. Riesgo preliminar ${SELF_INSPECTION_RISK_LABELS[input.overallRiskLevel].toLowerCase()}.`,
    input.finalComment?.trim() ? `Comentario final: ${input.finalComment.trim()}.` : null,
  ];

  return segments.filter(Boolean).join(" ");
}

function canSessionAccessInspection(
  session: Awaited<ReturnType<typeof getCurrentSession>>,
  inspection: PublicInspectionEntity,
) {
  if (!session) {
    return false;
  }

  if (session.user.role !== UserRole.CUSTOMER) {
    return false;
  }

  if (isPendingInspectionCustomer(inspection.customer)) {
    return true;
  }

  if (session.user.clientId) {
    return session.user.clientId === inspection.customer.id;
  }

  return normalizeEmail(session.user.email) === normalizeEmail(inspection.customer.email);
}

async function ensureCustomerAccountLinkedToClient(session: CustomerSession, clientId: string) {
  if (session.user.clientId === clientId) {
    return;
  }

  await userRepository.linkClient(session.user.id, clientId);
}

async function claimPendingInspectionCustomer(
  inspection: PublicInspectionEntity,
  session: CustomerSession,
) {
  if (!isPendingInspectionCustomer(inspection.customer)) {
    await ensureCustomerAccountLinkedToClient(session, inspection.customer.id);
    return inspection;
  }

  const normalizedEmail = normalizeEmail(session.user.email);

  await prisma.$transaction(async (tx) => {
    const currentInspection = await tx.selfInspection.findUnique({
      where: {
        id: inspection.id,
      },
      include: {
        customer: true,
      },
    });

    if (!currentInspection || !isPendingInspectionCustomer(currentInspection.customer)) {
      return;
    }

    const linkedCustomer = session.user.clientId
      ? await tx.client.findUnique({
          where: {
            id: session.user.clientId,
          },
        })
      : null;
    const existingCustomer =
      linkedCustomer && !isPendingInspectionCustomer(linkedCustomer)
        ? linkedCustomer
        : await tx.client.findFirst({
            where: {
              email: {
                equals: normalizedEmail,
                mode: "insensitive",
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          });

    if (existingCustomer) {
      await tx.selfInspection.update({
        where: {
          id: inspection.id,
        },
        data: {
          customerId: existingCustomer.id,
        },
      });

      if (session.user.clientId !== existingCustomer.id) {
        await tx.user.update({
          where: {
            id: session.user.id,
          },
          data: {
            client: {
              connect: {
                id: existingCustomer.id,
              },
            },
          },
        });
      }

      return;
    }

    await tx.client.update({
      where: {
        id: currentInspection.customer.id,
      },
      data: {
        fullName: session.user.name.trim() || PENDING_SELF_INSPECTION_CLIENT_NAME,
        email: normalizedEmail,
        localIdentifier: null,
      },
    });

    if (session.user.clientId !== currentInspection.customer.id) {
      await tx.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          client: {
            connect: {
              id: currentInspection.customer.id,
            },
          },
        },
      });
    }
  });

  return getPublicSelfInspectionEntityById(inspection.id);
}

function buildInspectionVehicleSyncPayload(
  inspection: {
    vehicle: {
      id: string;
      plate: string | null;
      vin: string;
      make: string;
      model: string;
      year: number;
      color: string | null;
      mileage: number | null;
      fuelType: VehicleFuelType | null;
      transmission: VehicleTransmissionType | null;
    } | null;
    vehicleSnapshot: {
      plate: string | null;
      vin: string | null;
      make: string;
      model: string;
      year: number;
      color: string | null;
      mileage: number;
      fuelType: VehicleFuelType;
      transmission: VehicleTransmissionType;
    } | null;
  },
  answersMap: AnswerMap,
) {
  if (!inspection.vehicleSnapshot) {
    return null;
  }

  const plateSource = answersMap.vehicle_plate ?? inspection.vehicleSnapshot.plate ?? inspection.vehicle?.plate;
  const vinSource = answersMap.vehicle_vin ?? inspection.vehicleSnapshot.vin ?? inspection.vehicle?.vin;
  const make = String(
    answersMap.vehicle_make ?? inspection.vehicleSnapshot.make ?? inspection.vehicle?.make ?? "",
  ).trim();
  const model = String(
    answersMap.vehicle_model ?? inspection.vehicleSnapshot.model ?? inspection.vehicle?.model ?? "",
  ).trim();
  const year = Number(
    answersMap.vehicle_year ?? inspection.vehicleSnapshot.year ?? inspection.vehicle?.year ?? NaN,
  );
  const mileage = Number(
    answersMap.vehicle_mileage ??
      inspection.vehicleSnapshot.mileage ??
      inspection.vehicle?.mileage ??
      NaN,
  );
  const vin =
    typeof vinSource === "string" && vinSource.trim() !== "" ? normalizeVin(vinSource) : "";

  if (!vin) {
    throw new ConflictError(
      "La autoinspeccion debe incluir el VIN antes de vincular el vehiculo al cliente",
    );
  }

  if (!make || !model || !Number.isInteger(year) || !Number.isFinite(mileage)) {
    throw new ConflictError(
      "La autoinspeccion no tiene informacion suficiente para registrar el vehiculo",
    );
  }

  return {
    plate:
      typeof plateSource === "string" && plateSource.trim() !== ""
        ? normalizePlate(plateSource)
        : null,
    vin,
    make,
    model,
    year,
    color: inspection.vehicleSnapshot.color ?? inspection.vehicle?.color ?? null,
    mileage,
    fuelType:
      inspection.vehicleSnapshot.fuelType ??
      inspection.vehicle?.fuelType ??
      VehicleFuelType.OTHER,
    transmission:
      inspection.vehicleSnapshot.transmission ??
      inspection.vehicle?.transmission ??
      VehicleTransmissionType.OTHER,
  };
}

async function syncInspectionCustomerAndVehicle(
  tx: Prisma.TransactionClient,
  selfInspectionId: string,
) {
  const inspection = await tx.selfInspection.findUnique({
    where: {
      id: selfInspectionId,
    },
    include: {
      customer: true,
      vehicle: true,
      vehicleSnapshot: true,
      answers: {
        select: {
          questionKey: true,
          answerValue: true,
        },
      },
    },
  });

  if (!inspection || !inspection.vehicleSnapshot) {
    return;
  }

  const answersMap = mapAnswersToRecord(inspection.answers);
  const contactSnapshot = buildContactSnapshot(inspection.customer, answersMap);
  const vehiclePayload = buildInspectionVehicleSyncPayload(inspection, answersMap);

  if (!vehiclePayload) {
    return;
  }

  await tx.client.update({
    where: {
      id: inspection.customer.id,
    },
    data: {
      fullName: contactSnapshot.fullName.trim(),
      phone: contactSnapshot.phone.trim(),
      email: normalizeEmail(contactSnapshot.email),
    },
  });

  const [vehicleByVin, vehicleByPlate] = await Promise.all([
    tx.vehicle.findUnique({
      where: {
        vin: vehiclePayload.vin,
      },
    }),
    vehiclePayload.plate
      ? tx.vehicle.findUnique({
          where: {
            plate: vehiclePayload.plate,
          },
        })
      : Promise.resolve(null),
  ]);

  if (vehicleByVin && vehicleByPlate && vehicleByVin.id !== vehicleByPlate.id) {
    throw new ConflictError(
      "Ya existen vehiculos distintos con ese VIN y esa patente. Revisa la ficha antes de continuar.",
    );
  }

  const existingVehicle =
    vehicleByVin ??
    vehicleByPlate ??
    (inspection.vehicle
      ? await tx.vehicle.findUnique({
          where: {
            id: inspection.vehicle.id,
          },
        })
      : null);

  const vehicle = existingVehicle
    ? await tx.vehicle.update({
        where: {
          id: existingVehicle.id,
        },
        data: {
          clientId: inspection.customer.id,
          ...vehiclePayload,
        },
      })
    : await tx.vehicle.create({
        data: {
          clientId: inspection.customer.id,
          ...vehiclePayload,
        },
      });

  await tx.selfInspectionVehicleSnapshot.update({
    where: {
      selfInspectionId,
    },
    data: {
      plate: vehiclePayload.plate,
      vin: vehiclePayload.vin,
      make: vehiclePayload.make,
      model: vehiclePayload.model,
      year: vehiclePayload.year,
      color: vehiclePayload.color,
      mileage: vehiclePayload.mileage,
      fuelType: vehiclePayload.fuelType,
      transmission: vehiclePayload.transmission,
    },
  });

  await tx.selfInspection.update({
    where: {
      id: selfInspectionId,
    },
    data: {
      vehicleId: vehicle.id,
    },
  });
}

async function getPublicSelfInspectionEntity(token: string) {
  const inspection = await selfInspectionRepository.findByAccessTokenHash(hashAccessToken(token));

  if (!inspection) {
    throw new NotFoundError("Enlace de autoinspeccion no encontrado");
  }

  if (inspection.accessTokenExpiresAt && inspection.accessTokenExpiresAt < new Date()) {
    throw new AppError("El enlace seguro ha expirado", 410);
  }

  return inspection;
}

async function getPublicSelfInspectionEntityById(id: string) {
  const inspection = await selfInspectionRepository.findPublicById(id);

  if (!inspection) {
    throw new NotFoundError("Autoinspeccion no encontrada");
  }

  return inspection;
}

async function getAuthorizedPublicSelfInspectionEntity(token: string) {
  const inspection = await getPublicSelfInspectionEntity(token);
  const session = await getCurrentSession();

  if (!session) {
    throw new UnauthorizedError("Inicia sesion para continuar con la autoinspeccion");
  }

  if (session.user.role !== UserRole.CUSTOMER) {
    throw new ForbiddenError("Esta autoinspeccion requiere una cuenta de cliente");
  }

  if (!canSessionAccessInspection(session, inspection)) {
    throw new ForbiddenError("Esta autoinspeccion fue enviada a otro correo");
  }

  return claimPendingInspectionCustomer(inspection, session);
}

async function assertInspectionCustomerEditableByToken(token: string) {
  const inspection = await getAuthorizedPublicSelfInspectionEntity(token);

  if (!isCustomerEditableStatus(inspection.status)) {
    throw new ConflictError("La autoinspeccion ya fue enviada y no admite mas cambios");
  }

  return inspection;
}

function buildPublicSelfInspectionWizardPayload(inspection: PublicInspectionEntity) {
  const answersMap = mapAnswersToRecord(inspection.answers);
  const customerNotes = parseCustomerNotes(inspection.notes);
  const contactSnapshot = buildContactSnapshot(inspection.customer, answersMap);
  const criticalFindings = createCriticalFindings({
    snapshot: inspection.vehicleSnapshot
      ? {
          starts: inspection.vehicleSnapshot.starts,
        }
      : null,
    canDrive: inspection.canDrive,
    answersMap,
  });

  return {
    inspection: {
      id: inspection.id,
      status: inspection.status,
      statusLabel: SELF_INSPECTION_STATUS_LABELS[inspection.status],
      overallRiskLevel: inspection.overallRiskLevel,
      overallRiskLabel: SELF_INSPECTION_RISK_LABELS[inspection.overallRiskLevel],
      sourceChannel: inspection.sourceChannel,
      completionPercent: inspection.completionPercent,
      lastCompletedStep: inspection.lastCompletedStep,
      startedAt: inspection.startedAt,
      submittedAt: inspection.submittedAt,
      summaryGenerated: inspection.summaryGenerated,
      accessTokenExpiresAt: inspection.accessTokenExpiresAt,
    },
    customer: {
      id: inspection.customer.id,
      fullName: contactSnapshot.fullName,
      phone: contactSnapshot.phone,
      email: contactSnapshot.email,
    },
    form: {
      customerVehicle: buildCustomerVehicleStepDraft(inspection, answersMap),
      problem: buildProblemStepDraft(inspection, answersMap),
      evidence: customerNotes,
    },
    photos: inspection.photos.map((photo) => ({
      id: photo.id,
      photoType: photo.photoType,
      photoTypeLabel: SELF_INSPECTION_PHOTO_TYPE_LABELS[photo.photoType],
      fileUrl: photo.fileUrl,
      fileName: photo.fileName,
      comment: photo.comment,
      isRequired: photo.isRequired,
      sortOrder: photo.sortOrder,
      createdAt: photo.createdAt,
    })),
    photoSlots: SELF_INSPECTION_PHOTO_SLOTS,
    criticalFindings,
    missingRequiredPhotoTypes: SELF_INSPECTION_REQUIRED_PHOTO_TYPES.filter(
      (photoType) => !inspection.photos.some((photo) => photo.photoType === photoType),
    ),
  };
}

async function updateInspectionDerivedState(selfInspectionId: string, input?: { lastCompletedStep?: number }) {
  const inspection = await selfInspectionRepository.findSummaryById(selfInspectionId);

  if (!inspection) {
    throw new NotFoundError("Autoinspeccion no encontrada");
  }

  const answersMap = mapAnswersToRecord(inspection.answers);
  const contactSnapshot = buildContactSnapshot(inspection.customer, answersMap);
  const overallRiskLevel = calculateRiskLevel({
    snapshot: inspection.vehicleSnapshot
      ? {
          starts: inspection.vehicleSnapshot.starts,
        }
      : null,
    canDrive: inspection.canDrive,
    answersMap,
  });
  const customerNotes = parseCustomerNotes(inspection.notes);
  const summaryGenerated = buildSummary({
    contact: contactSnapshot,
    snapshot: inspection.vehicleSnapshot
      ? {
          plate: inspection.vehicleSnapshot.plate,
          make: inspection.vehicleSnapshot.make,
          model: inspection.vehicleSnapshot.model,
          year: inspection.vehicleSnapshot.year,
          mileage: inspection.vehicleSnapshot.mileage,
          starts: inspection.vehicleSnapshot.starts,
        }
      : null,
    canDrive: inspection.canDrive,
    overallRiskLevel,
    answersMap,
    photoCount: inspection.photos.length,
    finalComment: customerNotes.finalComment,
  });
  const lastCompletedStep = Math.max(
    input?.lastCompletedStep ?? inspection.lastCompletedStep,
    inspection.lastCompletedStep,
  );
  const nextStatus =
    inspection.status === SelfInspectionStatus.DRAFT && lastCompletedStep > 0
      ? SelfInspectionStatus.IN_PROGRESS
      : inspection.status;

  await prisma.selfInspection.update({
    where: {
      id: selfInspectionId,
    },
    data: {
      status: nextStatus,
      overallRiskLevel,
      summaryGenerated,
      lastCompletedStep,
      completionPercent: getCompletionPercent(lastCompletedStep, nextStatus),
    },
  });
}

async function upsertAnswerRecords(selfInspectionId: string, answers: AnswerRecordInput[]) {
  if (answers.length === 0) {
    return;
  }

  await prisma.$transaction(
    answers.map((answer) =>
      prisma.selfInspectionAnswer.upsert({
        where: {
          selfInspectionId_questionKey: {
            selfInspectionId,
            questionKey: answer.questionKey,
          },
        },
        create: {
          selfInspectionId,
          section: answer.section,
          questionKey: answer.questionKey,
          questionLabel: answer.questionLabel,
          answerType: answer.answerType,
          answerValue: answer.answerValue,
          severity: answer.severity,
        },
        update: {
          section: answer.section,
          questionLabel: answer.questionLabel,
          answerType: answer.answerType,
          answerValue: answer.answerValue,
          severity: answer.severity,
        },
      }),
    ),
  );
}

async function deleteDeprecatedPublicAnswers(selfInspectionId: string) {
  await prisma.selfInspectionAnswer.deleteMany({
    where: {
      selfInspectionId,
      questionKey: {
        notIn: [...SELF_INSPECTION_PUBLIC_QUESTION_KEYS],
      },
    },
  });
}

async function persistCustomerNotes(
  selfInspectionId: string,
  input: {
    finalComment?: string;
  },
) {
  await prisma.$transaction(async (tx) => {
    await tx.selfInspectionNote.deleteMany({
      where: {
        selfInspectionId,
        noteType: FINAL_COMMENT_NOTE_TYPE,
      },
    });

    const finalComment = input.finalComment?.trim();

    if (!finalComment) {
      return;
    }

    await tx.selfInspectionNote.create({
      data: {
        selfInspectionId,
        noteType: FINAL_COMMENT_NOTE_TYPE,
        content: serializeNoteContent(FINAL_COMMENT_FIELD_KEY, finalComment),
      },
    });
  });
}

function buildCustomerVehicleAnswerRecords(
  data: ReturnType<typeof selfInspectionVehicleStepSchema.parse>,
) {
  return [
    buildAnswerRecord("customer_full_name", data.fullName),
    buildAnswerRecord("customer_phone", data.phone),
    buildAnswerRecord("customer_email", data.email.toLowerCase()),
    buildAnswerRecord("vehicle_plate", data.plate),
    buildAnswerRecord("vehicle_vin", data.vin),
    buildAnswerRecord("vehicle_make", data.make),
    buildAnswerRecord("vehicle_model", data.model),
    buildAnswerRecord("vehicle_year", data.year),
    buildAnswerRecord("vehicle_mileage", data.mileage),
  ];
}

function buildProblemAnswerRecords(data: ReturnType<typeof selfInspectionReasonStepSchema.parse>) {
  return [
    buildAnswerRecord("reason_problem_type", data.problemType),
    buildAnswerRecord("vehicle_starts", data.vehicleStarts),
    buildAnswerRecord("reason_can_drive", data.canDrive),
    buildAnswerRecord("reason_warning_lights", data.warningLights),
    buildAnswerRecord("reason_problem_since", data.problemSince),
    buildAnswerRecord("reason_issue_frequency", data.issueFrequency),
    buildAnswerRecord("reason_problem_description", data.description),
  ];
}

function getRequiredAnswerKeysForSubmission() {
  return [...SELF_INSPECTION_REQUIRED_ANSWER_KEYS];
}

function isAnswerMissing(value: unknown) {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  return false;
}

export async function listSelfInspections(input?: unknown) {
  const filters = selfInspectionFiltersSchema.parse(input ?? {});
  const inspections = await selfInspectionRepository.list({
    search: filters.q?.trim(),
    status: filters.status,
    risk: filters.risk,
  });

  return inspections.map((inspection) => {
    const answersMap = mapAnswersToRecord(inspection.answers);
    const contactSnapshot = buildContactSnapshot(inspection.customer, answersMap);
    const criticalFindings = createCriticalFindings({
      snapshot: inspection.vehicleSnapshot
        ? {
            starts: inspection.vehicleSnapshot.starts,
          }
        : null,
      canDrive: inspection.canDrive,
      answersMap,
    });

    return {
      ...inspection,
      customer: {
        ...inspection.customer,
        ...contactSnapshot,
      },
      criticalFindings,
    };
  });
}

export async function getSelfInspectionById(id: string) {
  const inspection = await selfInspectionRepository.findById(id);

  if (!inspection) {
    throw new NotFoundError("Autoinspeccion no encontrada");
  }

  const answersMap = mapAnswersToRecord(inspection.answers);
  const contactSnapshot = buildContactSnapshot(inspection.customer, answersMap);
  const groupedAnswers = Object.entries(SELF_INSPECTION_SECTION_LABELS).map(
    ([sectionKey, sectionLabel]) => ({
      key: sectionKey,
      label: sectionLabel,
      answers: inspection.answers.filter((answer) => answer.section === sectionKey),
    }),
  );
  const criticalFindings = createCriticalFindings({
    snapshot: inspection.vehicleSnapshot
      ? {
          starts: inspection.vehicleSnapshot.starts,
        }
      : null,
    canDrive: inspection.canDrive,
    answersMap,
  });
  const missingRequiredPhotoTypes = SELF_INSPECTION_REQUIRED_PHOTO_TYPES.filter(
    (photoType) => !inspection.photos.some((photo) => photo.photoType === photoType),
  );

  return {
    ...inspection,
    customer: {
      ...inspection.customer,
      ...contactSnapshot,
    },
    groupedAnswers,
    criticalFindings,
    missingRequiredPhotoTypes,
  };
}

export async function createSelfInspectionInvite(input: unknown, actorId?: string) {
  const data = createSelfInspectionInviteSchema.parse(input) as CreateSelfInspectionInviteInput;
  const rawToken = createAccessToken();
  const accessTokenHash = hashAccessToken(rawToken);
  const accessTokenExpiresAt = new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000);
  const pendingClient = createPendingClientDraft();

  const created = await prisma.$transaction(async (tx) => {
    const customer = await tx.client.create({
      data: pendingClient,
    });

    const inspection = await tx.selfInspection.create({
      data: {
        customerId: customer.id,
        sourceChannel: data.sourceChannel,
        accessTokenHash,
        accessTokenExpiresAt,
        status: SelfInspectionStatus.DRAFT,
        lastCompletedStep: 0,
        completionPercent: 0,
      },
    });

    await tx.selfInspectionStatusLog.create({
      data: {
        selfInspectionId: inspection.id,
        previousStatus: null,
        nextStatus: SelfInspectionStatus.DRAFT,
        note: "Autoinspeccion creada y enlace seguro generado",
      },
    });

    return {
      inspection,
      customer,
    };
  });

  const invite = {
    inspectionId: created.inspection.id,
    token: rawToken,
    accessTokenExpiresAt,
    publicPath: `/self-inspections/start/${rawToken}`,
    customer: {
      id: created.customer.id,
      fullName: created.customer.fullName,
    },
    vehicle: null,
  };

  selfInspectionLogger.info("Self-inspection invite created", {
    actorId,
    inspectionId: invite.inspectionId,
    customerId: created.customer.id,
    sourceChannel: data.sourceChannel,
  });

  return invite;
}

export async function getPublicSelfInspectionStartPageData(token: string) {
  let inspection = await getPublicSelfInspectionEntity(token);
  const session = await getCurrentSession();
  const authorized = canSessionAccessInspection(session, inspection);

  if (authorized && session?.user.role === UserRole.CUSTOMER) {
    inspection = await claimPendingInspectionCustomer(inspection, session);
  }

  return {
    access: {
      authorized,
      sessionEmail: session?.user.email ?? null,
      sessionRole: session?.user.role ?? null,
      status: inspection.status,
      statusLabel: SELF_INSPECTION_STATUS_LABELS[inspection.status],
    },
    wizardData: authorized ? buildPublicSelfInspectionWizardPayload(inspection) : null,
  };
}

export async function authorizePublicSelfInspectionAccess(token: string, input: unknown) {
  const inspection = await getPublicSelfInspectionEntity(token);
  const data = publicSelfInspectionAccessSchema.parse(input);
  const email = normalizeEmail(data.email);

  if (data.mode === "register") {
    const existing = await userRepository.findByEmail(email);

    if (existing) {
      if (!existing.active) {
        throw new ConflictError("Ya existe una cuenta desactivada para este correo");
      }

      if (existing.role !== UserRole.CUSTOMER) {
        throw new ConflictError("Este correo ya esta ocupado por otra cuenta del sistema");
      }

      throw new ConflictError("Ya existe una cuenta con este correo. Inicia sesion.");
    }

    await userRepository.create({
      name: data.fullName,
      email,
      passwordHash: await hash(data.password, 10),
      role: UserRole.CUSTOMER,
      clientId: inspection.customer.id,
    });
  }

  const user = await signIn({
    email,
    password: data.password,
  });

  if (user.role !== UserRole.CUSTOMER) {
    await signOut();
    throw new ForbiddenError("Esta autoinspeccion requiere una cuenta de cliente");
  }

  if (
    !isPendingInspectionCustomer(inspection.customer) &&
    normalizeEmail(inspection.customer.email) !== email
  ) {
    await signOut();
    throw new ForbiddenError("Esta autoinspeccion ya esta asociada a otra cuenta");
  }

  selfInspectionLogger.info("Self-inspection public access authorized", {
    inspectionId: inspection.id,
    customerEmail: email,
    mode: data.mode,
  });

  return {
    authorized: true,
    customerEmail: email,
  };
}

export async function getPublicSelfInspectionWizard(token: string) {
  const inspection = await getAuthorizedPublicSelfInspectionEntity(token);
  return buildPublicSelfInspectionWizardPayload(inspection);
}

export async function savePublicSelfInspectionVehicle(token: string, input: unknown) {
  const inspection = await assertInspectionCustomerEditableByToken(token);
  const data = selfInspectionVehicleStepSchema.parse(input);

  await prisma.selfInspectionVehicleSnapshot.upsert({
    where: {
      selfInspectionId: inspection.id,
    },
    create: {
      selfInspectionId: inspection.id,
      plate: data.plate,
      vin: data.vin,
      make: data.make,
      model: data.model,
      year: data.year,
      color: inspection.vehicleSnapshot?.color ?? inspection.vehicle?.color ?? null,
      mileage: data.mileage,
      fuelType:
        inspection.vehicleSnapshot?.fuelType ?? inspection.vehicle?.fuelType ?? VehicleFuelType.OTHER,
      transmission:
        inspection.vehicleSnapshot?.transmission ??
        inspection.vehicle?.transmission ??
        VehicleTransmissionType.OTHER,
      starts: inspection.vehicleSnapshot?.starts ?? true,
    },
    update: {
      plate: data.plate,
      vin: data.vin,
      make: data.make,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
    },
  });

  await deleteDeprecatedPublicAnswers(inspection.id);
  await upsertAnswerRecords(inspection.id, buildCustomerVehicleAnswerRecords(data));
  await updateInspectionDerivedState(inspection.id, { lastCompletedStep: 1 });

  return getPublicSelfInspectionWizard(token);
}

export async function savePublicSelfInspectionReason(token: string, input: unknown) {
  const inspection = await assertInspectionCustomerEditableByToken(token);
  const data = selfInspectionReasonStepSchema.parse(input);

  if (!inspection.vehicleSnapshot) {
    throw new ConflictError("Debes completar primero los datos del vehiculo");
  }

  const mappedReason = mapProblemTypeToInspectionReason(data.problemType);

  await prisma.$transaction(async (tx) => {
    await tx.selfInspection.update({
      where: {
        id: inspection.id,
      },
      data: {
        inspectionReason: mappedReason.inspectionReason,
        inspectionReasonOther: mappedReason.inspectionReasonOther,
        mainComplaint: data.description,
        canDrive: data.canDrive,
      },
    });

    await tx.selfInspectionVehicleSnapshot.update({
      where: {
        selfInspectionId: inspection.id,
      },
      data: {
        starts: data.vehicleStarts,
      },
    });
  });

  await deleteDeprecatedPublicAnswers(inspection.id);
  await upsertAnswerRecords(inspection.id, buildProblemAnswerRecords(data));
  await updateInspectionDerivedState(inspection.id, { lastCompletedStep: 2 });

  return getPublicSelfInspectionWizard(token);
}

export async function uploadPublicSelfInspectionPhoto(
  token: string,
  file: File,
  input: unknown,
) {
  const inspection = await assertInspectionCustomerEditableByToken(token);
  const data = selfInspectionPhotoUploadSchema.parse(input);
  const slot = SELF_INSPECTION_PHOTO_SLOTS.find((entry) => entry.photoType === data.photoType);
  const uploaded = await saveInspectionPhotoFile({
    inspectionId: inspection.id,
    photoType: data.photoType,
    file,
  });
  const existingPhotos = await prisma.selfInspectionPhoto.findMany({
    where: {
      selfInspectionId: inspection.id,
      photoType: data.photoType,
    },
  });

  await prisma.$transaction(async (tx) => {
    if (existingPhotos.length > 0) {
      await tx.selfInspectionPhoto.deleteMany({
        where: {
          id: {
            in: existingPhotos.map((photo) => photo.id),
          },
        },
      });
    }

    await tx.selfInspectionPhoto.create({
      data: {
        selfInspectionId: inspection.id,
        photoType: data.photoType,
        fileUrl: uploaded.fileUrl,
        storageKey: uploaded.storageKey,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        sortOrder: slot?.sortOrder ?? data.sortOrder,
        isRequired: slot?.required ?? false,
        comment: data.comment ?? null,
      },
    });
  });

  await Promise.all(existingPhotos.map((photo) => deleteInspectionPhotoFile(photo.storageKey)));
  await updateInspectionDerivedState(inspection.id, { lastCompletedStep: 3 });

  return getPublicSelfInspectionWizard(token);
}

export async function deletePublicSelfInspectionPhoto(token: string, photoId: string) {
  const inspection = await assertInspectionCustomerEditableByToken(token);
  const photo = await prisma.selfInspectionPhoto.findFirst({
    where: {
      id: photoId,
      selfInspectionId: inspection.id,
    },
  });

  if (!photo) {
    throw new NotFoundError("Foto de autoinspeccion no encontrada");
  }

  await prisma.selfInspectionPhoto.delete({
    where: {
      id: photo.id,
    },
  });
  await deleteInspectionPhotoFile(photo.storageKey);
  await updateInspectionDerivedState(inspection.id, { lastCompletedStep: 3 });

  return getPublicSelfInspectionWizard(token);
}

export async function submitPublicSelfInspection(token: string, input: unknown) {
  const data = submitSelfInspectionSchema.parse(input);
  const editableInspection = await assertInspectionCustomerEditableByToken(token);
  const inspection = await selfInspectionRepository.findSummaryById(editableInspection.id);

  if (!inspection || !inspection.vehicleSnapshot) {
    throw new AppError("Debes completar la informacion del vehiculo antes de enviar", 422);
  }

  const answersMap = mapAnswersToRecord(inspection.answers);
  const requiredAnswerKeys = getRequiredAnswerKeysForSubmission();
  const missingAnswers = requiredAnswerKeys.filter((questionKey) =>
    isAnswerMissing(answersMap[questionKey]),
  );
  const missingPhotoTypes = SELF_INSPECTION_REQUIRED_PHOTO_TYPES.filter(
    (photoType) => !inspection.photos.some((photo) => photo.photoType === photoType),
  );

  if (missingAnswers.length > 0) {
    const labels = missingAnswers
      .slice(0, 5)
      .map((questionKey) => SELF_INSPECTION_QUESTION_DEFINITIONS[questionKey]?.label ?? questionKey);
    throw new AppError(`Faltan respuestas obligatorias: ${labels.join(", ")}`, 422);
  }

  if (missingPhotoTypes.length > 0) {
    const labels = missingPhotoTypes
      .map((photoType) => SELF_INSPECTION_PHOTO_TYPE_LABELS[photoType])
      .join(", ");
    throw new AppError(`Faltan imagenes obligatorias: ${labels}`, 422);
  }

  await persistCustomerNotes(inspection.id, {
    finalComment: data.finalComment,
  });

  const refreshed = await selfInspectionRepository.findSummaryById(inspection.id);

  if (!refreshed || !refreshed.vehicleSnapshot) {
    throw new AppError("No fue posible recalcular la autoinspeccion", 500);
  }

  const refreshedAnswersMap = mapAnswersToRecord(refreshed.answers);
  const contactSnapshot = buildContactSnapshot(refreshed.customer, refreshedAnswersMap);
  const customerNotes = parseCustomerNotes(refreshed.notes);
  const overallRiskLevel = calculateRiskLevel({
    snapshot: {
      starts: refreshed.vehicleSnapshot.starts,
    },
    canDrive: refreshed.canDrive,
    answersMap: refreshedAnswersMap,
  });
  const summaryGenerated = buildSummary({
    contact: contactSnapshot,
    snapshot: {
      plate: refreshed.vehicleSnapshot.plate,
      make: refreshed.vehicleSnapshot.make,
      model: refreshed.vehicleSnapshot.model,
      year: refreshed.vehicleSnapshot.year,
      mileage: refreshed.vehicleSnapshot.mileage,
      starts: refreshed.vehicleSnapshot.starts,
    },
    canDrive: refreshed.canDrive,
    overallRiskLevel,
    answersMap: refreshedAnswersMap,
    photoCount: refreshed.photos.length,
    finalComment: customerNotes.finalComment,
  });

  await prisma.$transaction(async (tx) => {
    await tx.selfInspection.update({
      where: {
        id: refreshed.id,
      },
      data: {
        status: SelfInspectionStatus.SUBMITTED,
        submittedAt: new Date(),
        overallRiskLevel,
        summaryGenerated,
        lastCompletedStep: 3,
        completionPercent: 100,
      },
    });

    await tx.selfInspectionStatusLog.create({
      data: {
        selfInspectionId: refreshed.id,
        previousStatus: editableInspection.status,
        nextStatus: SelfInspectionStatus.SUBMITTED,
        note: "Autoinspeccion enviada por el cliente",
      },
    });
  });

  selfInspectionLogger.info("Self-inspection submitted", {
    inspectionId: refreshed.id,
    customerId: refreshed.customer.id,
    overallRiskLevel,
  });

  return getPublicSelfInspectionWizard(token);
}

export async function updateSelfInspectionStatus(id: string, input: unknown, actorId: string) {
  const parsedStatus = updateSelfInspectionStatusSchema.parse(input);
  const existing = await prisma.selfInspection.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existing) {
    throw new NotFoundError("Autoinspeccion no encontrada");
  }

  if (existing.status === parsedStatus.status) {
    return getSelfInspectionById(id);
  }

  await prisma.$transaction(async (tx) => {
    await tx.selfInspection.update({
      where: {
        id,
      },
      data: {
        status: parsedStatus.status,
        reviewerId:
          parsedStatus.status === SelfInspectionStatus.UNDER_REVIEW ||
          parsedStatus.status === SelfInspectionStatus.REVIEWED
            ? actorId
            : undefined,
        reviewedAt:
          parsedStatus.status === SelfInspectionStatus.REVIEWED ? new Date() : undefined,
      },
    });

    if (shouldMaterializeInspectionVehicle(parsedStatus.status)) {
      await syncInspectionCustomerAndVehicle(tx, id);
    }

    await tx.selfInspectionStatusLog.create({
      data: {
        selfInspectionId: id,
        previousStatus: existing.status,
        nextStatus: parsedStatus.status,
        note: parsedStatus.note ?? "Cambio de estado manual",
        changedById: actorId,
      },
    });
  });

  const inspection = await getSelfInspectionById(id);

  selfInspectionLogger.info("Self-inspection status updated", {
    actorId,
    inspectionId: inspection.id,
    status: inspection.status,
  });

  return inspection;
}

export async function reviewSelfInspection(id: string, input: unknown, actorId: string) {
  const data = reviewSelfInspectionSchema.parse(input);
  const existing = await prisma.selfInspection.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existing) {
    throw new NotFoundError("Autoinspeccion no encontrada");
  }

  await prisma.$transaction(async (tx) => {
    await tx.selfInspectionReview.create({
      data: {
        selfInspectionId: id,
        reviewedById: actorId,
        riskAssessment: data.riskAssessment,
        internalSummary: data.internalSummary,
        recommendedNextStep: data.recommendedNextStep,
        departmentSuggestion: data.departmentSuggestion ?? null,
        createWorkOrderSuggestion: data.createWorkOrderSuggestion,
        createQuoteSuggestion: data.createQuoteSuggestion,
      },
    });

    if (data.note) {
      await tx.selfInspectionNote.create({
        data: {
          selfInspectionId: id,
          noteType: SelfInspectionNoteType.INTERNAL_REVIEW,
          content: data.note,
          createdById: actorId,
        },
      });
    }

    await tx.selfInspection.update({
      where: {
        id,
      },
      data: {
        status: SelfInspectionStatus.REVIEWED,
        reviewedAt: new Date(),
        reviewerId: actorId,
        operationalOutcome: data.operationalOutcome,
        overallRiskLevel: data.riskAssessment,
      },
    });

    await syncInspectionCustomerAndVehicle(tx, id);

    await tx.selfInspectionStatusLog.create({
      data: {
        selfInspectionId: id,
        previousStatus: existing.status,
        nextStatus: SelfInspectionStatus.REVIEWED,
        note: `Revision interna registrada. Resultado operativo: ${SELF_INSPECTION_OPERATIONAL_OUTCOME_LABELS[data.operationalOutcome]}. Proximo paso sugerido: ${SELF_INSPECTION_NEXT_STEP_LABELS[data.recommendedNextStep]}`,
        changedById: actorId,
      },
    });
  });

  const inspection = await getSelfInspectionById(id);

  selfInspectionLogger.info("Self-inspection reviewed", {
    actorId,
    inspectionId: inspection.id,
    operationalOutcome: data.operationalOutcome,
    status: inspection.status,
    recommendedNextStep: data.recommendedNextStep,
  });

  return inspection;
}

export type PublicSelfInspectionStartPageData = Awaited<
  ReturnType<typeof getPublicSelfInspectionStartPageData>
>;
export type PublicSelfInspectionWizardData = Awaited<
  ReturnType<typeof getPublicSelfInspectionWizard>
>;
export type SelfInspectionDetailData = Awaited<ReturnType<typeof getSelfInspectionById>>;

const selfInspectionLogger = createLogger("self-inspections");
