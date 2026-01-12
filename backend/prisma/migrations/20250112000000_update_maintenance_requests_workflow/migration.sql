-- AlterEnum
ALTER TYPE "MaintenanceStatus" RENAME TO "MaintenanceStatus_old";
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'DONE');

-- AlterTable: Update existing data to new status values
UPDATE "MaintenanceRequest" SET status = 'PENDING' WHERE status = 'NEW';

-- Alter MaintenanceRequest table
ALTER TABLE "MaintenanceRequest" 
  ALTER COLUMN "status" TYPE "MaintenanceStatus" USING (status::text::"MaintenanceStatus"),
  ALTER COLUMN "status" SET DEFAULT 'PENDING',
  ADD COLUMN "approvedById" INTEGER,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "rejectionReason" TEXT;

-- Drop old enum type
DROP TYPE "MaintenanceStatus_old";

-- CreateIndex
CREATE INDEX "MaintenanceRequest_approvedById_idx" ON "MaintenanceRequest"("approvedById");

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
