-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "StudentDocumentCategory" AS ENUM (
    'DIPLOMA',
    'QUESTIONNAIRE',
    'EXPLANATORY',
    'MEDICAL',
    'IDENTITY',
    'CONTRACT',
    'APPLICATION',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "category" "StudentDocumentCategory" DEFAULT 'OTHER';
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "fileType" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "issueDate" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Document_category_idx" ON "Document"("category");
