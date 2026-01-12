-- Step 1: Add new fields to MaintenanceRequest
ALTER TABLE "MaintenanceRequest" 
  ADD COLUMN IF NOT EXISTS "approvedById" INTEGER,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Step 2: Drop default value temporarily
ALTER TABLE "MaintenanceRequest" 
  ALTER COLUMN "status" DROP DEFAULT;

-- Step 3: Convert column to text
ALTER TABLE "MaintenanceRequest" 
  ALTER COLUMN "status" TYPE TEXT;

-- Step 4: Update existing values
UPDATE "MaintenanceRequest" SET status = 'PENDING' WHERE status = 'NEW';

-- Step 5: Create new enum type
DO $$ BEGIN
  CREATE TYPE "MaintenanceStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'DONE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 6: Alter column to use new enum type
ALTER TABLE "MaintenanceRequest" 
  ALTER COLUMN "status" TYPE "MaintenanceStatus_new" USING (status::"MaintenanceStatus_new");

-- Step 7: Drop old enum and rename new one
DROP TYPE IF EXISTS "MaintenanceStatus";
ALTER TYPE "MaintenanceStatus_new" RENAME TO "MaintenanceStatus";

-- Step 8: Set new default
ALTER TABLE "MaintenanceRequest" 
  ALTER COLUMN "status" SET DEFAULT 'PENDING'::"MaintenanceStatus";

-- Step 9: Create indexes
CREATE INDEX IF NOT EXISTS "MaintenanceRequest_approvedById_idx" ON "MaintenanceRequest"("approvedById");

-- Step 10: Add foreign key constraint
ALTER TABLE "MaintenanceRequest" 
  ADD CONSTRAINT "MaintenanceRequest_approvedById_fkey" 
  FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;
