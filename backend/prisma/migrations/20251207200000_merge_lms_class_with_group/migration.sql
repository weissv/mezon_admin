-- Миграция: Объединение LmsSchoolClass с Group
-- Идемпотентная миграция - безопасна для повторного запуска

-- 1. Добавляем новые поля в Group (идемпотентно)
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "grade" INTEGER;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "academicYear" TEXT;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "teacherId" INTEGER;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "capacity" INTEGER DEFAULT 30;
ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Добавляем createdAt/updatedAt если не существуют
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Group' AND column_name = 'createdAt') THEN
    ALTER TABLE "Group" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Group' AND column_name = 'updatedAt') THEN
    ALTER TABLE "Group" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- 2. Индекс и FK на teacherId для Group (идемпотентно)
CREATE INDEX IF NOT EXISTS "Group_teacherId_idx" ON "Group"("teacherId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Group_teacherId_fkey') THEN
    ALTER TABLE "Group" ADD CONSTRAINT "Group_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. Добавляем недостающие колонки в LmsStudentAttendance
ALTER TABLE "LmsStudentAttendance" ADD COLUMN IF NOT EXISTS "classId" INTEGER;
ALTER TABLE "LmsStudentAttendance" ADD COLUMN IF NOT EXISTS "scheduleItemId" INTEGER;

-- 4. Удаляем все FK на LmsSchoolClass (идемпотентно)
ALTER TABLE "LmsSchoolStudent" DROP CONSTRAINT IF EXISTS "LmsSchoolStudent_classId_fkey";
ALTER TABLE "LmsScheduleItem" DROP CONSTRAINT IF EXISTS "LmsScheduleItem_classId_fkey";
ALTER TABLE "LmsGrade" DROP CONSTRAINT IF EXISTS "LmsGrade_classId_fkey";
ALTER TABLE "LmsHomework" DROP CONSTRAINT IF EXISTS "LmsHomework_classId_fkey";
ALTER TABLE "LmsStudentAttendance" DROP CONSTRAINT IF EXISTS "LmsStudentAttendance_classId_fkey";

-- 5. Добавляем FK к Group (идемпотентно через DO блоки)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'LmsSchoolStudent_classId_fkey') THEN
    ALTER TABLE "LmsSchoolStudent" ADD CONSTRAINT "LmsSchoolStudent_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'LmsScheduleItem_classId_fkey') THEN
    ALTER TABLE "LmsScheduleItem" ADD CONSTRAINT "LmsScheduleItem_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'LmsGrade_classId_fkey') THEN
    ALTER TABLE "LmsGrade" ADD CONSTRAINT "LmsGrade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'LmsHomework_classId_fkey') THEN
    ALTER TABLE "LmsHomework" ADD CONSTRAINT "LmsHomework_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'LmsStudentAttendance_classId_fkey') THEN
    ALTER TABLE "LmsStudentAttendance" ADD CONSTRAINT "LmsStudentAttendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 6. Удаляем таблицу LmsSchoolClass (идемпотентно)
DROP TABLE IF EXISTS "LmsSchoolClass";

