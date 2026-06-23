CREATE TYPE "TimeOffRequestType" AS ENUM ('VACATION', 'PERMISSION', 'MEDICAL', 'OTHER');

CREATE TYPE "TimeOffRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE "MechanicPaymentConcept" AS ENUM ('BASE_SALARY', 'ORDER_BONUS', 'ADVANCE', 'OTHER');

CREATE TABLE "MechanicTimeOffRequest" (
  "id" TEXT NOT NULL,
  "mechanicId" TEXT NOT NULL,
  "reviewedById" TEXT,
  "type" "TimeOffRequestType" NOT NULL,
  "status" "TimeOffRequestStatus" NOT NULL DEFAULT 'PENDING',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "reviewNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MechanicTimeOffRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MechanicPayment" (
  "id" TEXT NOT NULL,
  "mechanicId" TEXT NOT NULL,
  "issuedById" TEXT NOT NULL,
  "concept" "MechanicPaymentConcept" NOT NULL,
  "amount" INTEGER NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MechanicPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MechanicTimeOffRequest_mechanicId_startDate_idx" ON "MechanicTimeOffRequest"("mechanicId", "startDate");
CREATE INDEX "MechanicTimeOffRequest_status_startDate_idx" ON "MechanicTimeOffRequest"("status", "startDate");
CREATE INDEX "MechanicTimeOffRequest_reviewedById_idx" ON "MechanicTimeOffRequest"("reviewedById");

CREATE INDEX "MechanicPayment_mechanicId_paidAt_idx" ON "MechanicPayment"("mechanicId", "paidAt");
CREATE INDEX "MechanicPayment_issuedById_paidAt_idx" ON "MechanicPayment"("issuedById", "paidAt");
CREATE INDEX "MechanicPayment_concept_paidAt_idx" ON "MechanicPayment"("concept", "paidAt");

ALTER TABLE "MechanicTimeOffRequest"
  ADD CONSTRAINT "MechanicTimeOffRequest_mechanicId_fkey"
  FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MechanicTimeOffRequest"
  ADD CONSTRAINT "MechanicTimeOffRequest_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MechanicPayment"
  ADD CONSTRAINT "MechanicPayment_mechanicId_fkey"
  FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MechanicPayment"
  ADD CONSTRAINT "MechanicPayment_issuedById_fkey"
  FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
