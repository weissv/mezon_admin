-- AlterEnum: Добавляем значение OTHER в enum InventoryType
ALTER TYPE "InventoryType" ADD VALUE IF NOT EXISTS 'OTHER';
