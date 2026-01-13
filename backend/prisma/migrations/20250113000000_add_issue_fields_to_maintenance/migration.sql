-- CreateEnum: ItemCategory для категорий товаров в заявках на выдачу
CREATE TYPE "ItemCategory" AS ENUM ('STATIONERY', 'HOUSEHOLD', 'OTHER');

-- AlterTable: Добавляем новые поля в MaintenanceRequest для заявок типа ISSUE
ALTER TABLE "MaintenanceRequest" ADD COLUMN "unit" TEXT;
ALTER TABLE "MaintenanceRequest" ADD COLUMN "quantity" DOUBLE PRECISION;
ALTER TABLE "MaintenanceRequest" ADD COLUMN "itemCategory" "ItemCategory";
