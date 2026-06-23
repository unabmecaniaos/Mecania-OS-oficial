ALTER TABLE "Budget"
  ADD COLUMN IF NOT EXISTS "laborCostAmount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "workshopMarginPct" INTEGER NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS "discountAmount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "vatAmount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Budget"
SET
  "laborCostAmount" = COALESCE("subtotalLabor", 0),
  "workshopMarginPct" = COALESCE(NULLIF("workshopMarginPct", 0), 25),
  "discountAmount" = COALESCE("discountAmount", 0),
  "vatAmount" = COALESCE("vatAmount", 0)
WHERE TRUE;
