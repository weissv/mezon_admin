-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'WRITE_OFF');

-- AlterTable: InventoryItem - добавить minQuantity
ALTER TABLE "InventoryItem" ADD COLUMN "minQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable: MaintenanceItem - добавить issuedQuantity и inventoryItemId
ALTER TABLE "MaintenanceItem" ADD COLUMN "issuedQuantity" DOUBLE PRECISION;
ALTER TABLE "MaintenanceItem" ADD COLUMN "inventoryItemId" INTEGER;

-- CreateTable: InventoryTransaction (журнал движений склада)
CREATE TABLE "InventoryTransaction" (
    "id" SERIAL NOT NULL,
    "inventoryItemId" INTEGER NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "quantityBefore" DOUBLE PRECISION NOT NULL,
    "quantityAfter" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "maintenanceRequestId" INTEGER,
    "performedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryTransaction_inventoryItemId_createdAt_idx" ON "InventoryTransaction"("inventoryItemId", "createdAt");
CREATE INDEX "InventoryTransaction_maintenanceRequestId_idx" ON "InventoryTransaction"("maintenanceRequestId");
CREATE INDEX "InventoryTransaction_type_createdAt_idx" ON "InventoryTransaction"("type", "createdAt");

-- CreateIndex for MaintenanceItem.inventoryItemId
CREATE INDEX "MaintenanceItem_inventoryItemId_idx" ON "MaintenanceItem"("inventoryItemId");

-- CreateIndex for InventoryItem name+unit search
CREATE INDEX "InventoryItem_name_unit_idx" ON "InventoryItem"("name", "unit");

-- AddForeignKey
ALTER TABLE "MaintenanceItem" ADD CONSTRAINT "MaintenanceItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES "MaintenanceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
