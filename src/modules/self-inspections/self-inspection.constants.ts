import {
  ReviewRecommendedNextStep,
  SelfInspectionAnswerType,
  SelfInspectionDepartment,
  SelfInspectionOperationalOutcome,
  SelfInspectionPhotoType,
  SelfInspectionReason,
  SelfInspectionRiskLevel,
  SelfInspectionSource,
  SelfInspectionStatus,
} from "@prisma/client";

export const SELF_INSPECTION_WIZARD_STEPS = [
  { key: "customerVehicle", label: "Datos" },
  { key: "problem", label: "Problema" },
  { key: "evidence", label: "Evidencia" },
  { key: "confirmation", label: "Confirmacion" },
] as const;

export const SELF_INSPECTION_DATA_STEP_KEYS = [
  "customerVehicle",
  "problem",
  "evidence",
] as const;

export const SELF_INSPECTION_STATUS_LABELS: Record<SelfInspectionStatus, string> = {
  [SelfInspectionStatus.DRAFT]: "Borrador",
  [SelfInspectionStatus.IN_PROGRESS]: "En progreso",
  [SelfInspectionStatus.SUBMITTED]: "Enviada",
  [SelfInspectionStatus.UNDER_REVIEW]: "En revision",
  [SelfInspectionStatus.REVIEWED]: "Revisada",
  [SelfInspectionStatus.CONVERTED_TO_WORK_ORDER]: "Convertida a OT",
  [SelfInspectionStatus.CANCELLED]: "Cancelada",
};

export const SELF_INSPECTION_RISK_LABELS: Record<SelfInspectionRiskLevel, string> = {
  [SelfInspectionRiskLevel.LOW]: "Bajo",
  [SelfInspectionRiskLevel.MEDIUM]: "Medio",
  [SelfInspectionRiskLevel.HIGH]: "Alto",
  [SelfInspectionRiskLevel.CRITICAL]: "Critico",
};

export const SELF_INSPECTION_REASON_LABELS: Record<SelfInspectionReason, string> = {
  [SelfInspectionReason.PREVENTIVE_MAINTENANCE]: "Mantencion preventiva",
  [SelfInspectionReason.MECHANICAL_FAILURE]: "Falla mecanica",
  [SelfInspectionReason.STRANGE_NOISE]: "Ruido extrano",
  [SelfInspectionReason.DASHBOARD_WARNING_LIGHTS]: "Luces de tablero",
  [SelfInspectionReason.COLLISION_DAMAGE]: "Danos por choque",
  [SelfInspectionReason.BODY_PAINT_DAMAGE]: "Carroceria / pintura",
  [SelfInspectionReason.PRE_PURCHASE]: "Revision precompra",
  [SelfInspectionReason.OTHER]: "Otro",
};

export const SELF_INSPECTION_SOURCE_LABELS: Record<SelfInspectionSource, string> = {
  [SelfInspectionSource.CUSTOMER_PORTAL]: "Portal cliente",
  [SelfInspectionSource.SECURE_LINK]: "Enlace seguro",
  [SelfInspectionSource.STAFF_ASSISTED]: "Asistida por taller",
};

export const SELF_INSPECTION_DEPARTMENT_LABELS: Record<SelfInspectionDepartment, string> = {
  [SelfInspectionDepartment.MECHANICS]: "Mecanica",
  [SelfInspectionDepartment.BODY_PAINT]: "Carroceria y pintura",
  [SelfInspectionDepartment.ELECTRICAL]: "Electrico",
  [SelfInspectionDepartment.INSURANCE]: "Seguros",
  [SelfInspectionDepartment.GENERAL_DIAGNOSIS]: "Diagnostico general",
};

export const SELF_INSPECTION_NEXT_STEP_LABELS: Record<ReviewRecommendedNextStep, string> = {
  [ReviewRecommendedNextStep.SCHEDULE_DIAGNOSTIC]: "Agendar diagnostico",
  [ReviewRecommendedNextStep.REQUEST_TOW]: "Solicitar grua",
  [ReviewRecommendedNextStep.REFER_MECHANICS]: "Derivar a mecanica",
  [ReviewRecommendedNextStep.REFER_BODY_PAINT]: "Derivar a pintura",
  [ReviewRecommendedNextStep.REFER_ELECTRICAL]: "Derivar a electrico",
  [ReviewRecommendedNextStep.PREPARE_QUOTE]: "Preparar cotizacion",
  [ReviewRecommendedNextStep.REQUEST_MORE_EVIDENCE]: "Solicitar mas evidencia",
  [ReviewRecommendedNextStep.FOLLOW_UP_CALL]: "Llamada de seguimiento",
};

export const SELF_INSPECTION_OPERATIONAL_OUTCOME_LABELS: Record<
  SelfInspectionOperationalOutcome,
  string
> = {
  [SelfInspectionOperationalOutcome.REMOTE_QUOTE]: "Presupuesto remoto",
  [SelfInspectionOperationalOutcome.REQUEST_MORE_INFORMATION]: "Solicitar mas informacion",
  [SelfInspectionOperationalOutcome.REQUIRE_IN_PERSON_INSPECTION]:
    "Exigir inspeccion presencial",
};

export const SELF_INSPECTION_PHOTO_TYPE_LABELS: Record<SelfInspectionPhotoType, string> = {
  [SelfInspectionPhotoType.FRONTAL_FULL]: "Vehiculo completo",
  [SelfInspectionPhotoType.REAR_FULL]: "Trasera completa",
  [SelfInspectionPhotoType.LEFT_SIDE_FULL]: "Lateral izquierdo",
  [SelfInspectionPhotoType.RIGHT_SIDE_FULL]: "Lateral derecho",
  [SelfInspectionPhotoType.DASHBOARD_ON]: "Tablero / testigos",
  [SelfInspectionPhotoType.ODOMETER]: "Odometro visible",
  [SelfInspectionPhotoType.FRONT_LEFT_TIRE]: "Neumatico delantero izquierdo",
  [SelfInspectionPhotoType.FRONT_RIGHT_TIRE]: "Neumatico delantero derecho",
  [SelfInspectionPhotoType.REAR_LEFT_TIRE]: "Neumatico trasero izquierdo",
  [SelfInspectionPhotoType.REAR_RIGHT_TIRE]: "Neumatico trasero derecho",
  [SelfInspectionPhotoType.PRIMARY_DAMAGE]: "Foto principal del problema",
  [SelfInspectionPhotoType.DAMAGE_CONTEXT]: "Foto adicional de apoyo",
  [SelfInspectionPhotoType.ENGINE]: "Motor",
  [SelfInspectionPhotoType.TRUNK]: "Maletero",
  [SelfInspectionPhotoType.FRONT_INTERIOR]: "Interior delantero",
  [SelfInspectionPhotoType.REAR_INTERIOR]: "Interior trasero",
  [SelfInspectionPhotoType.VEHICLE_DOCUMENTS]: "Documentos del vehiculo",
  [SelfInspectionPhotoType.COLLISION_ZONE]: "Zona especifica del choque",
  [SelfInspectionPhotoType.FLUID_LEAK]: "Fuga visible",
  [SelfInspectionPhotoType.DASHBOARD_WARNING_DETAIL]: "Detalle de testigos",
  [SelfInspectionPhotoType.BROKEN_PART]: "Pieza rota",
  [SelfInspectionPhotoType.VIN_VISIBLE]: "VIN visible",
  [SelfInspectionPhotoType.OTHER]: "Otra evidencia",
};

export const SELF_INSPECTION_STATUS_OPTIONS = Object.entries(SELF_INSPECTION_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const SELF_INSPECTION_RISK_OPTIONS = Object.entries(SELF_INSPECTION_RISK_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const SELF_INSPECTION_DEPARTMENT_OPTIONS = Object.entries(
  SELF_INSPECTION_DEPARTMENT_LABELS,
).map(([value, label]) => ({ value, label }));

export const SELF_INSPECTION_NEXT_STEP_OPTIONS = Object.entries(
  SELF_INSPECTION_NEXT_STEP_LABELS,
).map(([value, label]) => ({ value, label }));

export const SELF_INSPECTION_OPERATIONAL_OUTCOME_OPTIONS = Object.entries(
  SELF_INSPECTION_OPERATIONAL_OUTCOME_LABELS,
).map(([value, label]) => ({ value, label }));

export const SELF_INSPECTION_PROBLEM_TYPE_LABELS = {
  MOTOR: "Motor",
  BRAKES: "Frenos",
  STEERING_SUSPENSION: "Suspension / direccion",
  ELECTRICAL_BATTERY: "Electrico / bateria",
  TRANSMISSION_CLUTCH: "Transmision / embrague",
  AC_HEATING: "Aire acondicionado / calefaccion",
  STRANGE_NOISE: "Ruido extrano",
  LEAK: "Fuga / perdida de liquido",
  OTHER: "Otro",
} as const;

export type SelfInspectionProblemType = keyof typeof SELF_INSPECTION_PROBLEM_TYPE_LABELS;

export const SELF_INSPECTION_PROBLEM_TYPE_OPTIONS = Object.entries(
  SELF_INSPECTION_PROBLEM_TYPE_LABELS,
).map(([value, label]) => ({ value, label }));

export const SELF_INSPECTION_PROBLEM_SINCE_LABELS = {
  TODAY: "Hoy",
  DAYS: "Hace unos dias",
  WEEKS: "Hace semanas",
  MONTHS: "Hace meses",
} as const;

export type SelfInspectionProblemSince = keyof typeof SELF_INSPECTION_PROBLEM_SINCE_LABELS;

export const SELF_INSPECTION_PROBLEM_SINCE_OPTIONS = Object.entries(
  SELF_INSPECTION_PROBLEM_SINCE_LABELS,
).map(([value, label]) => ({ value, label }));

export const SELF_INSPECTION_PROBLEM_FREQUENCY_LABELS = {
  CONSTANT: "Constante",
  INTERMITTENT: "Intermitente",
} as const;

export type SelfInspectionProblemFrequency =
  keyof typeof SELF_INSPECTION_PROBLEM_FREQUENCY_LABELS;

export const SELF_INSPECTION_PROBLEM_FREQUENCY_OPTIONS = Object.entries(
  SELF_INSPECTION_PROBLEM_FREQUENCY_LABELS,
).map(([value, label]) => ({ value, label }));

export const SELF_INSPECTION_SECTION_LABELS: Record<string, string> = {
  customer: "Datos del cliente",
  vehicle: "Datos del vehiculo",
  problem: "Problema principal",
  evidence: "Evidencia y comentario final",
  reason: "Motivo de inspeccion",
  operational: "Estado operativo basico",
  engine: "Motor y funcionamiento",
  brakes: "Frenos",
  steeringSuspension: "Direccion y suspension",
  transmission: "Transmision / embrague",
  tires: "Neumaticos y ruedas",
  electrical: "Sistema electrico",
  interior: "Interior / confort",
  exterior: "Exterior / carroceria",
  damage: "Danos y siniestros",
  history: "Historial reportado",
};

export type SelfInspectionQuestionDefinition = {
  key: string;
  section: string;
  label: string;
  answerType: SelfInspectionAnswerType;
};

export const SELF_INSPECTION_QUESTION_DEFINITIONS: Record<
  string,
  SelfInspectionQuestionDefinition
> = {
  customer_full_name: {
    key: "customer_full_name",
    section: "customer",
    label: "Nombre completo",
    answerType: SelfInspectionAnswerType.TEXT,
  },
  customer_phone: {
    key: "customer_phone",
    section: "customer",
    label: "Telefono",
    answerType: SelfInspectionAnswerType.TEXT,
  },
  customer_email: {
    key: "customer_email",
    section: "customer",
    label: "Correo",
    answerType: SelfInspectionAnswerType.TEXT,
  },
  vehicle_plate: {
    key: "vehicle_plate",
    section: "vehicle",
    label: "Patente",
    answerType: SelfInspectionAnswerType.TEXT,
  },
  vehicle_vin: {
    key: "vehicle_vin",
    section: "vehicle",
    label: "VIN",
    answerType: SelfInspectionAnswerType.TEXT,
  },
  vehicle_make: {
    key: "vehicle_make",
    section: "vehicle",
    label: "Marca",
    answerType: SelfInspectionAnswerType.TEXT,
  },
  vehicle_model: {
    key: "vehicle_model",
    section: "vehicle",
    label: "Modelo",
    answerType: SelfInspectionAnswerType.TEXT,
  },
  vehicle_year: {
    key: "vehicle_year",
    section: "vehicle",
    label: "Ano",
    answerType: SelfInspectionAnswerType.NUMBER,
  },
  vehicle_mileage: {
    key: "vehicle_mileage",
    section: "vehicle",
    label: "Kilometraje aproximado",
    answerType: SelfInspectionAnswerType.NUMBER,
  },
  reason_problem_type: {
    key: "reason_problem_type",
    section: "problem",
    label: "Tipo de problema",
    answerType: SelfInspectionAnswerType.SINGLE_CHOICE,
  },
  vehicle_starts: {
    key: "vehicle_starts",
    section: "problem",
    label: "El vehiculo enciende",
    answerType: SelfInspectionAnswerType.BOOLEAN,
  },
  reason_can_drive: {
    key: "reason_can_drive",
    section: "problem",
    label: "Se puede conducir normalmente",
    answerType: SelfInspectionAnswerType.BOOLEAN,
  },
  reason_warning_lights: {
    key: "reason_warning_lights",
    section: "problem",
    label: "Hay luces de advertencia encendidas en el tablero",
    answerType: SelfInspectionAnswerType.BOOLEAN,
  },
  reason_problem_since: {
    key: "reason_problem_since",
    section: "problem",
    label: "Desde cuando comenzo el problema",
    answerType: SelfInspectionAnswerType.SINGLE_CHOICE,
  },
  reason_issue_frequency: {
    key: "reason_issue_frequency",
    section: "problem",
    label: "El problema es constante o intermitente",
    answerType: SelfInspectionAnswerType.SINGLE_CHOICE,
  },
  reason_problem_description: {
    key: "reason_problem_description",
    section: "problem",
    label: "Descripcion breve del problema",
    answerType: SelfInspectionAnswerType.LONG_TEXT,
  },
};

export const SELF_INSPECTION_PUBLIC_QUESTION_KEYS = [
  "customer_full_name",
  "customer_phone",
  "customer_email",
  "vehicle_plate",
  "vehicle_vin",
  "vehicle_make",
  "vehicle_model",
  "vehicle_year",
  "vehicle_mileage",
  "reason_problem_type",
  "vehicle_starts",
  "reason_can_drive",
  "reason_warning_lights",
  "reason_problem_since",
  "reason_issue_frequency",
  "reason_problem_description",
] as const;

export const SELF_INSPECTION_REQUIRED_ANSWER_KEYS = [
  ...SELF_INSPECTION_PUBLIC_QUESTION_KEYS,
] as const;

export const SELF_INSPECTION_REQUIRED_PHOTO_TYPES: SelfInspectionPhotoType[] = [
  SelfInspectionPhotoType.PRIMARY_DAMAGE,
] as const;

export const SELF_INSPECTION_PHOTO_SLOTS = [
  {
    photoType: SelfInspectionPhotoType.PRIMARY_DAMAGE,
    label: "Foto principal del problema",
    helpText: "Sube una imagen clara de la falla o zona afectada.",
    required: true,
    sortOrder: 1,
  },
  {
    photoType: SelfInspectionPhotoType.DAMAGE_CONTEXT,
    label: "Foto adicional de apoyo",
    helpText: "Muestra mejor el contexto o agrega otro angulo util.",
    required: false,
    sortOrder: 2,
  },
  {
    photoType: SelfInspectionPhotoType.DASHBOARD_ON,
    label: "Tablero / testigos",
    helpText: "Ideal si hay luces de advertencia encendidas.",
    required: false,
    sortOrder: 3,
  },
  {
    photoType: SelfInspectionPhotoType.FRONTAL_FULL,
    label: "Vehiculo completo",
    helpText: "Opcional, sirve para ubicar mejor el problema en el vehiculo.",
    required: false,
    sortOrder: 4,
  },
  {
    photoType: SelfInspectionPhotoType.OTHER,
    label: "Otra evidencia",
    helpText: "Usa este espacio si quieres adjuntar una imagen extra relevante.",
    required: false,
    sortOrder: 5,
  },
] as const;
