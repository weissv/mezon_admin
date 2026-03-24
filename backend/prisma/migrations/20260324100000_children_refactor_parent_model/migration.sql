-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterEnum
ALTER TYPE "ChildStatus" ADD VALUE 'ARCHIVED';

-- CreateTable: Parent
CREATE TABLE "Parent" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "workplace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Parent_childId_idx" ON "Parent"("childId");

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate gender from free-text string to Gender enum
-- First add a temp column, migrate data, drop old, rename
ALTER TABLE "Child" ADD COLUMN "gender_new" "Gender";

UPDATE "Child" SET "gender_new" = 'MALE' WHERE LOWER("gender") IN ('мужской', 'male', 'м', 'm');
UPDATE "Child" SET "gender_new" = 'FEMALE' WHERE LOWER("gender") IN ('женский', 'female', 'ж', 'f');

ALTER TABLE "Child" DROP COLUMN "gender";
ALTER TABLE "Child" RENAME COLUMN "gender_new" TO "gender";

-- Migrate existing parent data into Parent table
INSERT INTO "Parent" ("childId", "fullName", "relation", "phone", "updatedAt")
SELECT "id", "fatherName", 'отец', "parentPhone", NOW()
FROM "Child"
WHERE "fatherName" IS NOT NULL AND "fatherName" != '';

INSERT INTO "Parent" ("childId", "fullName", "relation", "phone", "updatedAt")
SELECT "id", "motherName", 'мать', "parentPhone", NOW()
FROM "Child"
WHERE "motherName" IS NOT NULL AND "motherName" != '';

-- Add composite indexes for search optimization
CREATE INDEX "Child_lastName_firstName_idx" ON "Child"("lastName", "firstName");
CREATE INDEX "Child_status_idx" ON "Child"("status");
