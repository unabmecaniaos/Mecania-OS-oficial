BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''PaymentStatus'') THEN
    CREATE TYPE "PaymentStatus" AS ENUM (''PENDING'', ''REPORTED'', ''PAID'');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''BillingDocumentType'') THEN
    CREATE TYPE "BillingDocumentType" AS ENUM (''INVOICE'', ''RECEIPT'');
  END IF;
END $$;

ALTER TABLE "WorkOrder"
  ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT ''PENDING'',
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paymentReference" VARCHAR(80);

ALTER TABLE "Budget"
  ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT ''PENDING'',
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paymentReference" VARCHAR(80);

CREATE TABLE IF NOT EXISTS "BillingDocument" (
  "id" TEXT NOT NULL,
  "budgetId" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "type" "BillingDocumentType" NOT NULL,
  "folio" VARCHAR(40) NOT NULL,
  "customerTaxId" VARCHAR(32) NOT NULL,
  "customerBusinessName" VARCHAR(160) NOT NULL,
  "notes" TEXT,
  "netAmount" INTEGER NOT NULL,
  "vatAmount" INTEGER NOT NULL,
  "totalAmount" INTEGER NOT NULL,
  "pdfFileName" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BillingDocument_workOrderId_type_key" ON "BillingDocument"("workOrderId", "type");
CREATE UNIQUE INDEX IF NOT EXISTS "BillingDocument_type_folio_key" ON "BillingDocument"("type", "folio");
CREATE INDEX IF NOT EXISTS "BillingDocument_budgetId_issuedAt_idx" ON "BillingDocument"("budgetId", "issuedAt");
CREATE INDEX IF NOT EXISTS "BillingDocument_workOrderId_issuedAt_idx" ON "BillingDocument"("workOrderId", "issuedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = ''BillingDocument_budgetId_fkey''
  ) THEN
    ALTER TABLE "BillingDocument"
      ADD CONSTRAINT "BillingDocument_budgetId_fkey"
      FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = ''BillingDocument_workOrderId_fkey''
  ) THEN
    ALTER TABLE "BillingDocument"
      ADD CONSTRAINT "BillingDocument_workOrderId_fkey"
      FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = ''BillingDocument_createdById_fkey''
  ) THEN
    ALTER TABLE "BillingDocument"
      ADD CONSTRAINT "BillingDocument_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
