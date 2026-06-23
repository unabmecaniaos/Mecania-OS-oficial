export const DEFAULT_BUDGET_MARGIN_PCT = 25;
export const BUDGET_VAT_PERCENT = 19;

export type BudgetCommercialTotalsInput = {
  subtotalParts: number;
  subtotalLabor: number;
  subtotalSupplies: number;
  laborCostAmount?: number;
  workshopMarginPct?: number;
  discountAmount?: number;
};

function normalizeInteger(value: number | undefined, fallback = 0) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(Math.round(value ?? fallback), 0);
}

export function calculateBudgetCommercialTotals(input: BudgetCommercialTotalsInput) {
  const subtotalParts = normalizeInteger(input.subtotalParts);
  const subtotalLabor = normalizeInteger(input.subtotalLabor);
  const subtotalSupplies = normalizeInteger(input.subtotalSupplies);
  const laborCostAmount = normalizeInteger(input.laborCostAmount ?? input.subtotalLabor);
  const workshopMarginPct = Math.min(
    normalizeInteger(input.workshopMarginPct, DEFAULT_BUDGET_MARGIN_PCT),
    999,
  );

  const commercialBase = subtotalParts + laborCostAmount + subtotalSupplies;
  const marginBase = subtotalParts + laborCostAmount;
  const marginAmount = Math.round((marginBase * workshopMarginPct) / 100);
  const maxDiscountAmount = commercialBase + marginAmount;
  const discountAmount = Math.min(
    normalizeInteger(input.discountAmount),
    maxDiscountAmount,
  );
  const subtotalBeforeVat = Math.max(commercialBase + marginAmount - discountAmount, 0);
  const vatAmount = Math.round((subtotalBeforeVat * BUDGET_VAT_PERCENT) / 100);
  const totalAmount = subtotalBeforeVat + vatAmount;

  return {
    subtotalParts,
    subtotalLabor,
    subtotalSupplies,
    laborCostAmount,
    workshopMarginPct,
    marginAmount,
    commercialBase,
    maxDiscountAmount,
    discountAmount,
    subtotalBeforeVat,
    vatAmount,
    totalAmount,
  };
}
