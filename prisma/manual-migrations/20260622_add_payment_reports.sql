DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentReportSource') THEN
    CREATE TYPE "PaymentReportSource" AS ENUM ('CUSTOMER_PORTAL', 'LIQUIDATOR_PORTAL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentReportStatus') THEN
    CREATE TYPE "PaymentReportStatus" AS ENUM ('REPORTED', 'APPROVED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PaymentReport" (
  "id" TEXT NOT NULL,
  "budgetId" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "reportedById" TEXT NOT NULL,
  "approvedById" TEXT,
  "source" "PaymentReportSource" NOT NULL,
  "status" "PaymentReportStatus" NOT NULL DEFAULT 'REPORTED',
  "paymentReference" VARCHAR(80),
  "note" TEXT,
  "fileUrl" TEXT,
  "storageKey" TEXT,
  "fileName" TEXT,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  CONSTRAINT "PaymentReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentReport_storageKey_key" ON "PaymentReport"("storageKey");
CREATE INDEX IF NOT EXISTS "PaymentReport_budgetId_createdAt_idx" ON "PaymentReport"("budgetId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentReport_workOrderId_createdAt_idx" ON "PaymentReport"("workOrderId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentReport_status_createdAt_idx" ON "PaymentReport"("status", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PaymentReport_budgetId_fkey'
  ) THEN
    ALTER TABLE "PaymentReport"
      ADD CONSTRAINT "PaymentReport_budgetId_fkey"
      FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PaymentReport_workOrderId_fkey'
  ) THEN
    ALTER TABLE "PaymentReport"
      ADD CONSTRAINT "PaymentReport_workOrderId_fkey"
      FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PaymentReport_reportedById_fkey'
  ) THEN
    ALTER TABLE "PaymentReport"
      ADD CONSTRAINT "PaymentReport_reportedById_fkey"
      FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PaymentReport_approvedById_fkey'
  ) THEN
    ALTER TABLE "PaymentReport"
      ADD CONSTRAINT "PaymentReport_approvedById_fkey"
      FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
