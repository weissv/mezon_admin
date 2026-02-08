-- CreateEnum: PurchaseOrderType
CREATE TYPE "PurchaseOrderType" AS ENUM ('PLANNED', 'OPERATIONAL');

-- CreateEnum: PurchaseOrderStatus
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ORDERED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'RECEIVED', 'CANCELLED');

-- AlterTable: Supplier - добавить новые поля
ALTER TABLE "Supplier" ADD COLUMN "phone" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "email" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "address" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "inn" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Supplier" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Supplier" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 1: Add new columns to PurchaseOrder
ALTER TABLE "PurchaseOrder" ADD COLUMN "orderNumber" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "type" "PurchaseOrderType" NOT NULL DEFAULT 'PLANNED';
ALTER TABLE "PurchaseOrder" ADD COLUMN "title" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "description" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PurchaseOrder" ADD COLUMN "expectedDeliveryDate" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN "actualDeliveryDate" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN "budgetSource" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "createdById" INTEGER;
ALTER TABLE "PurchaseOrder" ADD COLUMN "approvedById" INTEGER;
ALTER TABLE "PurchaseOrder" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "receivedById" INTEGER;
ALTER TABLE "PurchaseOrder" ADD COLUMN "receivedAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN "receiveNote" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Populate orderNumber from id for existing rows
UPDATE "PurchaseOrder" SET "orderNumber" = CONCAT('PO-', LPAD(id::TEXT, 6, '0'));
UPDATE "PurchaseOrder" SET "title" = CONCAT('Закупка #', id) WHERE "title" IS NULL;

-- Step 3: Make orderNumber NOT NULL and UNIQUE
ALTER TABLE "PurchaseOrder" ALTER COLUMN "orderNumber" SET NOT NULL;
CREATE UNIQUE INDEX "PurchaseOrder_orderNumber_key" ON "PurchaseOrder"("orderNumber");

-- Step 4: Make title NOT NULL
ALTER TABLE "PurchaseOrder" ALTER COLUMN "title" SET NOT NULL;

-- Step 5: Migrate existing status string to new enum
-- First, add a temporary column for the new enum status
ALTER TABLE "PurchaseOrder" ADD COLUMN "status_new" "PurchaseOrderStatus";

-- Migrate statuses
UPDATE "PurchaseOrder" SET "status_new" = 'PENDING' WHERE "status" = 'PENDING';
UPDATE "PurchaseOrder" SET "status_new" = 'APPROVED' WHERE "status" = 'APPROVED';
UPDATE "PurchaseOrder" SET "status_new" = 'DELIVERED' WHERE "status" = 'DELIVERED';
UPDATE "PurchaseOrder" SET "status_new" = 'DRAFT' WHERE "status_new" IS NULL;

-- Drop old column, rename new
ALTER TABLE "PurchaseOrder" DROP COLUMN "status";
ALTER TABLE "PurchaseOrder" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "PurchaseOrder" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "PurchaseOrder" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- Rename deliveryDate to expectedDeliveryDate (copy data)
UPDATE "PurchaseOrder" SET "expectedDeliveryDate" = "deliveryDate" WHERE "deliveryDate" IS NOT NULL AND "expectedDeliveryDate" IS NULL;
ALTER TABLE "PurchaseOrder" DROP COLUMN "deliveryDate";

-- Update totalAmount precision
ALTER TABLE "PurchaseOrder" ALTER COLUMN "totalAmount" TYPE DECIMAL(12, 2);
ALTER TABLE "PurchaseOrder" ALTER COLUMN "totalAmount" SET DEFAULT 0;

-- Step 6: Alter PurchaseOrderItem
ALTER TABLE "PurchaseOrderItem" ADD COLUMN "inventoryItemId" INTEGER;
ALTER TABLE "PurchaseOrderItem" ADD COLUMN "name" TEXT;
ALTER TABLE "PurchaseOrderItem" ADD COLUMN "receivedQuantity" DOUBLE PRECISION;
ALTER TABLE "PurchaseOrderItem" ADD COLUMN "unit" TEXT;
ALTER TABLE "PurchaseOrderItem" ADD COLUMN "totalPrice" DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Populate name from ingredient for existing items
UPDATE "PurchaseOrderItem" poi SET 
  "name" = i."name",
  "unit" = i."unit",
  "totalPrice" = poi."quantity" * poi."price"
FROM "Ingredient" i WHERE poi."ingredientId" = i.id;

-- Make name NOT NULL
UPDATE "PurchaseOrderItem" SET "name" = 'Без названия' WHERE "name" IS NULL;
ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "name" SET NOT NULL;
UPDATE "PurchaseOrderItem" SET "unit" = 'шт' WHERE "unit" IS NULL;
ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "unit" SET NOT NULL;

-- Make ingredientId optional
ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "ingredientId" DROP NOT NULL;

-- Update price precision
ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "price" TYPE DECIMAL(12, 2);

-- Add ON DELETE CASCADE for PurchaseOrderItem -> PurchaseOrder
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT IF EXISTS "PurchaseOrderItem_orderId_fkey";
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add InventoryTransaction -> PurchaseOrder relation
ALTER TABLE "InventoryTransaction" ADD COLUMN "purchaseOrderId" INTEGER;

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_type_idx" ON "PurchaseOrder"("status", "type");
CREATE INDEX "PurchaseOrder_createdById_idx" ON "PurchaseOrder"("createdById");
CREATE INDEX "PurchaseOrder_approvedById_idx" ON "PurchaseOrder"("approvedById");
CREATE INDEX "PurchaseOrder_orderDate_idx" ON "PurchaseOrder"("orderDate");
CREATE INDEX "PurchaseOrderItem_inventoryItemId_idx" ON "PurchaseOrderItem"("inventoryItemId");
CREATE INDEX "InventoryTransaction_purchaseOrderId_idx" ON "InventoryTransaction"("purchaseOrderId");

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
