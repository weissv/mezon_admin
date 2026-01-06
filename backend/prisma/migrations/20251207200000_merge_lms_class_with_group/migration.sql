-- Миграция: Объединение LmsSchoolClass с Group
-- LmsSchoolClass имеет id TEXT, Group имеет id INTEGER
-- Нужно изменить classId во всех LMS таблицах с TEXT на INTEGER и перенаправить FK на Group

-- 1. Добавляем новые поля в Group
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

-- 2. Индекс и FK на teacherId для Group
CREATE INDEX IF NOT EXISTS "Group_teacherId_idx" ON "Group"("teacherId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Group_teacherId_fkey') THEN
    ALTER TABLE "Group" ADD CONSTRAINT "Group_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. Удаляем все FK на LmsSchoolClass
ALTER TABLE "LmsSchoolStudent" DROP CONSTRAINT IF EXISTS "LmsSchoolStudent_classId_fkey";
ALTER TABLE "LmsScheduleItem" DROP CONSTRAINT IF EXISTS "LmsScheduleItem_classId_fkey";
ALTER TABLE "LmsGrade" DROP CONSTRAINT IF EXISTS "LmsGrade_classId_fkey";
ALTER TABLE "LmsHomework" DROP CONSTRAINT IF EXISTS "LmsHomework_classId_fkey";
ALTER TABLE "LmsStudentAttendance" DROP CONSTRAINT IF EXISTS "LmsStudentAttendance_classId_fkey";

-- 4. Изменяем тип classId с TEXT на INTEGER
-- Сначала сбрасываем данные, так как нельзя просто конвертировать TEXT в INTEGER
-- (В продакшене нужна была бы миграция данных)
TRUNCATE "LmsStudentAttendance" CASCADE;
TRUNCATE "LmsHomeworkSubmission" CASCADE;
TRUNCATE "LmsGrade" CASCADE;
TRUNCATE "LmsHomework" CASCADE;
TRUNCATE "LmsScheduleItem" CASCADE;
TRUNCATE "LmsSchoolStudent" CASCADE;

-- Изменяем тип колонки classId
ALTER TABLE "LmsSchoolStudent" ALTER COLUMN "classId" TYPE INTEGER USING 0;
ALTER TABLE "LmsScheduleItem" ALTER COLUMN "classId" TYPE INTEGER USING 0;
ALTER TABLE "LmsGrade" ALTER COLUMN "classId" TYPE INTEGER USING 0;
ALTER TABLE "LmsHomework" ALTER COLUMN "classId" TYPE INTEGER USING 0;
ALTER TABLE "LmsStudentAttendance" ALTER COLUMN "classId" TYPE INTEGER USING 0;

-- 5. Добавляем FK к Group
ALTER TABLE "LmsSchoolStudent" ADD CONSTRAINT "LmsSchoolStudent_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LmsScheduleItem" ADD CONSTRAINT "LmsScheduleItem_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LmsGrade" ADD CONSTRAINT "LmsGrade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LmsHomework" ADD CONSTRAINT "LmsHomework_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LmsStudentAttendance" ADD CONSTRAINT "LmsStudentAttendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Удаляем таблицу LmsSchoolClass (больше не нужна)
DROP TABLE IF EXISTS "LmsSchoolClass";
