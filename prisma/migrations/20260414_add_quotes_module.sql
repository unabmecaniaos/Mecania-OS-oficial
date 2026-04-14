DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuoteStatus') THEN
    CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuoteRecipientType') THEN
    CREATE TYPE "QuoteRecipientType" AS ENUM ('CUSTOMER', 'INSURER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuoteItemType') THEN
    CREATE TYPE "QuoteItemType" AS ENUM ('LABOR', 'PART', 'SUPPLY');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Quote" (
  "id" TEXT NOT NULL,
  "quoteNumber" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "selfInspectionId" TEXT,
  "recipientType" "QuoteRecipientType" NOT NULL DEFAULT 'CUSTOMER',
  "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
  "summary" TEXT,
  "internalNotes" TEXT,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "sentById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "approvedById" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectedById" TEXT,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QuoteItem" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "type" "QuoteItemType" NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(10,2) NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "lineTotal" DECIMAL(12,2) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QuoteStatusLog" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "previousStatus" "QuoteStatus",
  "nextStatus" "QuoteStatus" NOT NULL,
  "note" TEXT,
  "changedById" TEXT NOT NULL,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "QuoteStatusLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
CREATE INDEX IF NOT EXISTS "Quote_clientId_createdAt_idx" ON "Quote"("clientId", "createdAt");
CREATE INDEX IF NOT EXISTS "Quote_vehicleId_createdAt_idx" ON "Quote"("vehicleId", "createdAt");
CREATE INDEX IF NOT EXISTS "Quote_selfInspectionId_idx" ON "Quote"("selfInspectionId");
CREATE INDEX IF NOT EXISTS "Quote_status_recipientType_idx" ON "Quote"("status", "recipientType");
CREATE INDEX IF NOT EXISTS "QuoteItem_quoteId_sortOrder_idx" ON "QuoteItem"("quoteId", "sortOrder");
CREATE INDEX IF NOT EXISTS "QuoteStatusLog_quoteId_changedAt_idx" ON "QuoteStatusLog"("quoteId", "changedAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quote_clientId_fkey') THEN
    ALTER TABLE "Quote"
      ADD CONSTRAINT "Quote_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quote_vehicleId_fkey') THEN
    ALTER TABLE "Quote"
      ADD CONSTRAINT "Quote_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quote_selfInspectionId_fkey') THEN
    ALTER TABLE "Quote"
      ADD CONSTRAINT "Quote_selfInspectionId_fkey"
      FOREIGN KEY ("selfInspectionId") REFERENCES "SelfInspection"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quote_createdById_fkey') THEN
    ALTER TABLE "Quote"
      ADD CONSTRAINT "Quote_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quote_updatedById_fkey') THEN
    ALTER TABLE "Quote"
      ADD CONSTRAINT "Quote_updatedById_fkey"
      FOREIGN KEY ("updatedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quote_sentById_fkey') THEN
    ALTER TABLE "Quote"
      ADD CONSTRAINT "Quote_sentById_fkey"
      FOREIGN KEY ("sentById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quote_approvedById_fkey') THEN
    ALTER TABLE "Quote"
      ADD CONSTRAINT "Quote_approvedById_fkey"
      FOREIGN KEY ("approvedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quote_rejectedById_fkey') THEN
    ALTER TABLE "Quote"
      ADD CONSTRAINT "Quote_rejectedById_fkey"
      FOREIGN KEY ("rejectedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuoteItem_quoteId_fkey') THEN
    ALTER TABLE "QuoteItem"
      ADD CONSTRAINT "QuoteItem_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuoteStatusLog_quoteId_fkey') THEN
    ALTER TABLE "QuoteStatusLog"
      ADD CONSTRAINT "QuoteStatusLog_quoteId_fkey"
      FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'QuoteStatusLog_changedById_fkey') THEN
    ALTER TABLE "QuoteStatusLog"
      ADD CONSTRAINT "QuoteStatusLog_changedById_fkey"
      FOREIGN KEY ("changedById") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
