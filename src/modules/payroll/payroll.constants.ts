import { MechanicPaymentConcept } from "@prisma/client";

export const MECHANIC_PAYMENT_CONCEPT_LABELS: Record<MechanicPaymentConcept, string> = {
  [MechanicPaymentConcept.BASE_SALARY]: "Sueldo base",
  [MechanicPaymentConcept.ORDER_BONUS]: "Bono por orden",
  [MechanicPaymentConcept.ADVANCE]: "Anticipo",
  [MechanicPaymentConcept.OTHER]: "Otro",
};

export const MECHANIC_PAYMENT_CONCEPT_OPTIONS = Object.entries(
  MECHANIC_PAYMENT_CONCEPT_LABELS,
).map(([value, label]) => ({
  value: value as MechanicPaymentConcept,
  label,
}));
