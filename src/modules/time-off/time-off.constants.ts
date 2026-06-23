import { TimeOffRequestStatus, TimeOffRequestType } from "@prisma/client";

export const TIME_OFF_REQUEST_TYPE_LABELS: Record<TimeOffRequestType, string> = {
  [TimeOffRequestType.VACATION]: "Vacaciones",
  [TimeOffRequestType.PERMISSION]: "Permiso",
  [TimeOffRequestType.MEDICAL]: "Licencia medica",
  [TimeOffRequestType.OTHER]: "Otro",
};

export const TIME_OFF_REQUEST_STATUS_LABELS: Record<TimeOffRequestStatus, string> = {
  [TimeOffRequestStatus.PENDING]: "Pendiente",
  [TimeOffRequestStatus.APPROVED]: "Aprobada",
  [TimeOffRequestStatus.REJECTED]: "Rechazada",
};

export const TIME_OFF_REQUEST_TYPE_OPTIONS = Object.entries(TIME_OFF_REQUEST_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as TimeOffRequestType,
    label,
  }),
);
