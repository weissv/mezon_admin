-- CreateTable
CREATE TABLE "LmsSchoolClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "section" TEXT,
    "academicYear" TEXT NOT NULL,
    "teacherId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsSchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsSchoolStudent" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "birthDate" TIMESTAMP(3),
    "classId" INTEGER NOT NULL,
    "parentPhone" TEXT,
    "parentEmail" TEXT,
    "parentName" TEXT,
    "userId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsSchoolStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsSubject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsScheduleItem" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "weekType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsGrade" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "grade" INTEGER NOT NULL,
    "gradeType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "date" TIMESTAMP(3) NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsHomework" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "attachments" JSONB,
    "maxScore" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsHomework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsHomeworkSubmission" (
    "id" SERIAL NOT NULL,
    "homeworkId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "content" TEXT,
    "attachments" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'submitted',

    CONSTRAINT "LmsHomeworkSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsStudentAttendance" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "recordedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsStudentAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LmsSchoolClass_teacherId_idx" ON "LmsSchoolClass"("teacherId");

-- CreateIndex
CREATE INDEX "LmsSchoolClass_grade_idx" ON "LmsSchoolClass"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "LmsSchoolClass_name_academicYear_key" ON "LmsSchoolClass"("name", "academicYear");

-- CreateIndex
CREATE INDEX "LmsSchoolStudent_classId_idx" ON "LmsSchoolStudent"("classId");

-- CreateIndex
CREATE INDEX "LmsSchoolStudent_userId_idx" ON "LmsSchoolStudent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsSubject_name_key" ON "LmsSubject"("name");

-- CreateIndex
CREATE INDEX "LmsScheduleItem_classId_idx" ON "LmsScheduleItem"("classId");

-- CreateIndex
CREATE INDEX "LmsScheduleItem_subjectId_idx" ON "LmsScheduleItem"("subjectId");

-- CreateIndex
CREATE INDEX "LmsScheduleItem_teacherId_idx" ON "LmsScheduleItem"("teacherId");

-- CreateIndex
CREATE INDEX "LmsScheduleItem_dayOfWeek_idx" ON "LmsScheduleItem"("dayOfWeek");

-- CreateIndex
CREATE INDEX "LmsGrade_studentId_idx" ON "LmsGrade"("studentId");

-- CreateIndex
CREATE INDEX "LmsGrade_subjectId_idx" ON "LmsGrade"("subjectId");

-- CreateIndex
CREATE INDEX "LmsGrade_classId_idx" ON "LmsGrade"("classId");

-- CreateIndex
CREATE INDEX "LmsGrade_date_idx" ON "LmsGrade"("date");

-- CreateIndex
CREATE INDEX "LmsHomework_classId_idx" ON "LmsHomework"("classId");

-- CreateIndex
CREATE INDEX "LmsHomework_subjectId_idx" ON "LmsHomework"("subjectId");

-- CreateIndex
CREATE INDEX "LmsHomework_dueDate_idx" ON "LmsHomework"("dueDate");

-- CreateIndex
CREATE INDEX "LmsHomeworkSubmission_homeworkId_idx" ON "LmsHomeworkSubmission"("homeworkId");

-- CreateIndex
CREATE INDEX "LmsHomeworkSubmission_studentId_idx" ON "LmsHomeworkSubmission"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsHomeworkSubmission_homeworkId_studentId_key" ON "LmsHomeworkSubmission"("homeworkId", "studentId");

-- CreateIndex
CREATE INDEX "LmsStudentAttendance_studentId_idx" ON "LmsStudentAttendance"("studentId");

-- CreateIndex
CREATE INDEX "LmsStudentAttendance_date_idx" ON "LmsStudentAttendance"("date");

-- AddForeignKey
ALTER TABLE "LmsSchoolStudent" ADD CONSTRAINT "LmsSchoolStudent_classId_fkey" FOREIGN KEY ("classId") REFERENCES "LmsSchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsScheduleItem" ADD CONSTRAINT "LmsScheduleItem_classId_fkey" FOREIGN KEY ("classId") REFERENCES "LmsSchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsScheduleItem" ADD CONSTRAINT "LmsScheduleItem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LmsSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGrade" ADD CONSTRAINT "LmsGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "LmsSchoolStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGrade" ADD CONSTRAINT "LmsGrade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LmsSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGrade" ADD CONSTRAINT "LmsGrade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "LmsSchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsHomework" ADD CONSTRAINT "LmsHomework_classId_fkey" FOREIGN KEY ("classId") REFERENCES "LmsSchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsHomework" ADD CONSTRAINT "LmsHomework_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LmsSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsHomeworkSubmission" ADD CONSTRAINT "LmsHomeworkSubmission_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "LmsHomework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsHomeworkSubmission" ADD CONSTRAINT "LmsHomeworkSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "LmsSchoolStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsStudentAttendance" ADD CONSTRAINT "LmsStudentAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "LmsSchoolStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
