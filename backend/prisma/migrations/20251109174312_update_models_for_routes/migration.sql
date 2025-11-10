/*
  Warnings:

  - You are about to drop the column `calories` on the `Dish` table. All the data in the column will be lost.
  - You are about to drop the column `carbs` on the `Dish` table. All the data in the column will be lost.
  - You are about to drop the column `fats` on the `Dish` table. All the data in the column will be lost.
  - You are about to drop the column `proteins` on the `Dish` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `DocumentTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerUnit` on the `PurchaseOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `rate` on the `StaffingTable` table. All the data in the column will be lost.
  - You are about to drop the column `requiredCount` on the `StaffingTable` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `DocumentTemplate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `DocumentTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `DocumentTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactInfo` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentName` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderDate` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `PurchaseOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requiredRate` to the `StaffingTable` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DocumentTemplate_title_key";

-- DropIndex
DROP INDEX "Event_startDate_idx";

-- AlterTable
ALTER TABLE "Dish" DROP COLUMN "calories",
DROP COLUMN "carbs",
DROP COLUMN "fats",
DROP COLUMN "proteins",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "preparationTime" INTEGER;

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "title",
DROP COLUMN "type",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "templateId" INTEGER;

-- AlterTable
ALTER TABLE "DocumentTemplate" DROP COLUMN "fileUrl",
DROP COLUMN "title",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EmployeeAttendance" ADD COLUMN     "hoursWorked" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "contactInfo" TEXT NOT NULL,
ADD COLUMN     "parentName" TEXT NOT NULL,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "response" TEXT;

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "protein" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "orderDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "totalAmount" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrderItem" DROP COLUMN "pricePerUnit",
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "StaffingTable" DROP COLUMN "rate",
DROP COLUMN "requiredCount",
ADD COLUMN     "requiredRate" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE INDEX "Document_templateId_idx" ON "Document"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_name_key" ON "DocumentTemplate"("name");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
