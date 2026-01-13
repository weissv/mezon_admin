-- AlterEnum: Добавляем значение ISSUE в enum MaintenanceType
ALTER TYPE "MaintenanceType" ADD VALUE IF NOT EXISTS 'ISSUE';
