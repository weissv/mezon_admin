-- AlterTable: Remove old fields from MaintenanceRequest
ALTER TABLE "MaintenanceRequest" DROP COLUMN IF EXISTS "unit";
ALTER TABLE "MaintenanceRequest" DROP COLUMN IF EXISTS "quantity";
ALTER TABLE "MaintenanceRequest" DROP COLUMN IF EXISTS "itemCategory";

-- CreateTable: MaintenanceItem (Detail table for multi-item requests)
CREATE TABLE "MaintenanceItem" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceItem_requestId_idx" ON "MaintenanceItem"("requestId");

-- AddForeignKey
ALTER TABLE "MaintenanceItem" ADD CONSTRAINT "MaintenanceItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
