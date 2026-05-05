import { BudgetItemType, BudgetStatus } from "@prisma/client";

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  [BudgetStatus.DRAFT]: "Borrador",
  [BudgetStatus.SENT]: "Enviado",
  [BudgetStatus.APPROVED]: "Aprobado",
  [BudgetStatus.REJECTED]: "Rechazado",
  [BudgetStatus.REQUEST_CHANGES]: "Solicita cambios",
  [BudgetStatus.PARTIALLY_APPROVED]: "Aprobado parcial",
  [BudgetStatus.CONVERTED_TO_WORK_ORDER]: "Convertido a orden",
};

export const BUDGET_ITEM_TYPE_LABELS: Record<BudgetItemType, string> = {
  [BudgetItemType.PART]: "Repuesto",
  [BudgetItemType.LABOR]: "Mano de obra",
  [BudgetItemType.SUPPLY]: "Suministro",
};
