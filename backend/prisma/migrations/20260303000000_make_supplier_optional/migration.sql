-- AlterTable: Make supplierId optional in PurchaseOrder
ALTER TABLE "PurchaseOrder" ALTER COLUMN "supplierId" DROP NOT NULL;

-- Update foreign key constraint to allow null
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT IF EXISTS "PurchaseOrder_supplierId_fkey";
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
