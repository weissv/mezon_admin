-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryItem_externalId_key" ON "InventoryItem"("externalId");