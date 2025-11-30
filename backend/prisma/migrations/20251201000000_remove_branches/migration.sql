-- Migration: Remove branch system
-- This migration removes the Branch model and all branchId foreign keys

-- Step 1: Drop foreign key constraints
ALTER TABLE "Employee" DROP CONSTRAINT IF EXISTS "Employee_branchId_fkey";
ALTER TABLE "Group" DROP CONSTRAINT IF EXISTS "Group_branchId_fkey";
ALTER TABLE "StaffingTable" DROP CONSTRAINT IF EXISTS "StaffingTable_branchId_fkey";
ALTER TABLE "CleaningSchedule" DROP CONSTRAINT IF EXISTS "CleaningSchedule_branchId_fkey";
ALTER TABLE "Equipment" DROP CONSTRAINT IF EXISTS "Equipment_branchId_fkey";

-- Step 2: Drop indexes
DROP INDEX IF EXISTS "Employee_branchId_idx";
DROP INDEX IF EXISTS "Group_branchId_idx";
DROP INDEX IF EXISTS "StaffingTable_branchId_idx";
DROP INDEX IF EXISTS "CleaningSchedule_branchId_idx";
DROP INDEX IF EXISTS "Equipment_branchId_nextCheckup_idx";

-- Step 3: Drop unique constraints
ALTER TABLE "Group" DROP CONSTRAINT IF EXISTS "Group_name_branchId_key";

-- Step 4: Drop branchId columns
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "branchId";
ALTER TABLE "Group" DROP COLUMN IF EXISTS "branchId";
ALTER TABLE "StaffingTable" DROP COLUMN IF EXISTS "branchId";
ALTER TABLE "CleaningSchedule" DROP COLUMN IF EXISTS "branchId";
ALTER TABLE "Equipment" DROP COLUMN IF EXISTS "branchId";

-- Step 5: Add unique constraint on Group.name
ALTER TABLE "Group" ADD CONSTRAINT "Group_name_key" UNIQUE ("name");

-- Step 6: Add unique constraint on StaffingTable.position
ALTER TABLE "StaffingTable" ADD CONSTRAINT "StaffingTable_position_key" UNIQUE ("position");

-- Step 7: Create new index for Equipment
CREATE INDEX IF NOT EXISTS "Equipment_nextCheckup_idx" ON "Equipment"("nextCheckup");

-- Step 8: Drop Branch table
DROP TABLE IF EXISTS "Branch";
