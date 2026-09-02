-- AlterEnum: Добавляем значение PURCHASE в enum MaintenanceType
ALTER TYPE "MaintenanceType" ADD VALUE IF NOT EXISTS 'PURCHASE';
