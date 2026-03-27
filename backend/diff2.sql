-- AlterEnum
BEGIN;
CREATE TYPE "InventoryType_new" AS ENUM ('FOOD', 'HOUSEHOLD', 'STATIONERY');
ALTER TABLE "InventoryItem" ALTER COLUMN "type" TYPE "InventoryType_new" USING ("type"::text::"InventoryType_new");
ALTER TYPE "InventoryType" RENAME TO "InventoryType_old";
ALTER TYPE "InventoryType_new" RENAME TO "InventoryType";
DROP TYPE "public"."InventoryType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MaintenanceType_new" AS ENUM ('REPAIR', 'ISSUE');
ALTER TABLE "MaintenanceRequest" ALTER COLUMN "type" TYPE "MaintenanceType_new" USING ("type"::text::"MaintenanceType_new");
ALTER TYPE "MaintenanceType" RENAME TO "MaintenanceType_old";
ALTER TYPE "MaintenanceType_new" RENAME TO "MaintenanceType";
DROP TYPE "public"."MaintenanceType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "ExamAnswer" DROP CONSTRAINT "ExamAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "LmsAnnouncement" DROP CONSTRAINT "LmsAnnouncement_courseId_fkey";

-- DropForeignKey
ALTER TABLE "LmsAssignment" DROP CONSTRAINT "LmsAssignment_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "LmsAttachment" DROP CONSTRAINT "LmsAttachment_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "LmsCertificate" DROP CONSTRAINT "LmsCertificate_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "LmsDiscussionMessage" DROP CONSTRAINT "LmsDiscussionMessage_threadId_fkey";

-- DropForeignKey
ALTER TABLE "LmsDiscussionThread" DROP CONSTRAINT "LmsDiscussionThread_courseId_fkey";

-- DropForeignKey
ALTER TABLE "LmsEnrollment" DROP CONSTRAINT "LmsEnrollment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "LmsGrade" DROP CONSTRAINT "LmsGrade_studentId_fkey";

-- DropForeignKey
ALTER TABLE "LmsGrade" DROP CONSTRAINT "LmsGrade_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "LmsHomework" DROP CONSTRAINT "LmsHomework_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "LmsHomeworkSubmission" DROP CONSTRAINT "LmsHomeworkSubmission_homeworkId_fkey";

-- DropForeignKey
ALTER TABLE "LmsHomeworkSubmission" DROP CONSTRAINT "LmsHomeworkSubmission_studentId_fkey";

-- DropForeignKey
ALTER TABLE "LmsLesson" DROP CONSTRAINT "LmsLesson_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "LmsLessonProgress" DROP CONSTRAINT "LmsLessonProgress_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "LmsLessonProgress" DROP CONSTRAINT "LmsLessonProgress_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "LmsModule" DROP CONSTRAINT "LmsModule_courseId_fkey";

-- DropForeignKey
ALTER TABLE "LmsQuestion" DROP CONSTRAINT "LmsQuestion_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "LmsScheduleItem" DROP CONSTRAINT "LmsScheduleItem_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "LmsStudentAttendance" DROP CONSTRAINT "LmsStudentAttendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "LmsSubmission" DROP CONSTRAINT "LmsSubmission_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "LmsSubmission" DROP CONSTRAINT "LmsSubmission_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_createdById_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_ingredientId_fkey";

-- DropIndex
DROP INDEX "InventoryTransaction_purchaseOrderId_idx";

-- DropIndex
DROP INDEX "LmsGrade_classId_idx";

-- DropIndex
DROP INDEX "LmsGrade_date_idx";

-- DropIndex
DROP INDEX "LmsHomework_classId_idx";

-- DropIndex
DROP INDEX "LmsHomework_dueDate_idx";

-- DropIndex
DROP INDEX "LmsHomework_subjectId_idx";

-- DropIndex
DROP INDEX "LmsHomeworkSubmission_homeworkId_idx";

-- DropIndex
DROP INDEX "LmsHomeworkSubmission_homeworkId_studentId_key";

-- DropIndex
DROP INDEX "LmsHomeworkSubmission_studentId_idx";

-- DropIndex
DROP INDEX "LmsScheduleItem_classId_idx";

-- DropIndex
DROP INDEX "LmsScheduleItem_dayOfWeek_idx";

-- DropIndex
DROP INDEX "LmsScheduleItem_subjectId_idx";

-- DropIndex
DROP INDEX "LmsScheduleItem_teacherId_idx";

-- DropIndex
DROP INDEX "LmsSchoolStudent_classId_idx";

-- DropIndex
DROP INDEX "LmsSchoolStudent_userId_idx";

-- DropIndex
DROP INDEX "LmsSubject_name_key";

-- AlterTable
ALTER TABLE "CashFlowArticle" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Contractor" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "organizer" DROP DEFAULT,
ALTER COLUMN "performers" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ExamAnswer" DROP COLUMN "aiConfidence",
DROP COLUMN "needsManualCheck";

-- AlterTable
ALTER TABLE "Group" ALTER COLUMN "capacity" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "KnowledgeBaseArticle" DROP COLUMN "roles",
ADD COLUMN     "roles" "Role"[];

-- AlterTable
ALTER TABLE "LmsGrade" DROP CONSTRAINT "LmsGrade_pkey",
DROP COLUMN "grade",
DROP COLUMN "weight",
ADD COLUMN     "maxValue" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "value" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "studentId" SET DATA TYPE TEXT,
ALTER COLUMN "subjectId" SET DATA TYPE TEXT,
ALTER COLUMN "teacherId" DROP NOT NULL,
ALTER COLUMN "gradeType" SET DEFAULT 'regular',
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "LmsGrade_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "LmsGrade_id_seq";

-- AlterTable
ALTER TABLE "LmsHomework" DROP CONSTRAINT "LmsHomework_pkey",
DROP COLUMN "assignedDate",
DROP COLUMN "attachments",
DROP COLUMN "isPublished",
DROP COLUMN "maxScore",
ADD COLUMN     "maxPoints" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subjectId" SET DATA TYPE TEXT,
ALTER COLUMN "description" DROP NOT NULL,
ADD CONSTRAINT "LmsHomework_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "LmsHomework_id_seq";

-- AlterTable
ALTER TABLE "LmsHomeworkSubmission" DROP CONSTRAINT "LmsHomeworkSubmission_pkey",
DROP COLUMN "attachments",
DROP COLUMN "score",
DROP COLUMN "status",
ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "points" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "homeworkId" SET DATA TYPE TEXT,
ALTER COLUMN "studentId" SET DATA TYPE TEXT,
ALTER COLUMN "gradedBy" SET DATA TYPE TEXT,
ADD CONSTRAINT "LmsHomeworkSubmission_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "LmsHomeworkSubmission_id_seq";

-- AlterTable
ALTER TABLE "LmsScheduleItem" DROP CONSTRAINT "LmsScheduleItem_pkey",
DROP COLUMN "isActive",
DROP COLUMN "weekType",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subjectId" SET DATA TYPE TEXT,
ALTER COLUMN "teacherId" DROP NOT NULL,
ADD CONSTRAINT "LmsScheduleItem_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "LmsScheduleItem_id_seq";

-- AlterTable
ALTER TABLE "LmsSchoolStudent" DROP CONSTRAINT "LmsSchoolStudent_pkey",
DROP COLUMN "birthDate",
DROP COLUMN "firstName",
DROP COLUMN "isActive",
DROP COLUMN "lastName",
DROP COLUMN "middleName",
DROP COLUMN "parentEmail",
DROP COLUMN "parentName",
DROP COLUMN "parentPhone",
DROP COLUMN "userId",
ADD COLUMN     "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "studentId" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "LmsSchoolStudent_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "LmsSchoolStudent_id_seq";

-- AlterTable
ALTER TABLE "LmsStudentAttendance" DROP CONSTRAINT "LmsStudentAttendance_pkey",
DROP COLUMN "recordedBy",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "studentId" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DEFAULT 'present',
ALTER COLUMN "classId" SET NOT NULL,
ALTER COLUMN "scheduleItemId" SET DATA TYPE TEXT,
ADD CONSTRAINT "LmsStudentAttendance_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "LmsStudentAttendance_id_seq";

-- AlterTable
ALTER TABLE "LmsSubject" DROP CONSTRAINT "LmsSubject_pkey",
DROP COLUMN "color",
DROP COLUMN "isActive",
DROP COLUMN "shortName",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "erpSubjectId" INTEGER,
ADD COLUMN     "grade" INTEGER,
ADD COLUMN     "hoursPerWeek" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "LmsSubject_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "LmsSubject_id_seq";

-- AlterTable
ALTER TABLE "Person" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PurchaseOrder" ALTER COLUMN "createdById" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RolePermission" ALTER COLUMN "modules" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "externalId" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "LmsAnnouncement";

-- DropTable
DROP TABLE "LmsAssignment";

-- DropTable
DROP TABLE "LmsAttachment";

-- DropTable
DROP TABLE "LmsCertificate";

-- DropTable
DROP TABLE "LmsCourse";

-- DropTable
DROP TABLE "LmsDiscussionMessage";

-- DropTable
DROP TABLE "LmsDiscussionThread";

-- DropTable
DROP TABLE "LmsEnrollment";

-- DropTable
DROP TABLE "LmsLesson";

-- DropTable
DROP TABLE "LmsLessonProgress";

-- DropTable
DROP TABLE "LmsModule";

-- DropTable
DROP TABLE "LmsQuestion";

-- DropTable
DROP TABLE "LmsSubmission";

-- DropEnum
DROP TYPE "AssignmentType";

-- DropEnum
DROP TYPE "CourseStatus";

-- DropEnum
DROP TYPE "EnrollmentStatus";

-- DropEnum
DROP TYPE "LessonType";

-- DropEnum
DROP TYPE "SubmissionStatus";

-- DropEnum
DROP TYPE "examquestiontype";

-- DropEnum
DROP TYPE "examstatus";

-- CreateTable
CREATE TABLE "LmsClassAnnouncement" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsClassAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LmsClassAnnouncement_classId_idx" ON "LmsClassAnnouncement"("classId");

-- CreateIndex
CREATE INDEX "LmsClassAnnouncement_authorId_idx" ON "LmsClassAnnouncement"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAnswer_submissionId_questionId_key" ON "ExamAnswer"("submissionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsSchoolStudent_studentId_classId_key" ON "LmsSchoolStudent"("studentId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsSubject_erpSubjectId_key" ON "LmsSubject"("erpSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_externalId_key" ON "Supplier"("externalId");

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsSchoolStudent" ADD CONSTRAINT "LmsSchoolStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsScheduleItem" ADD CONSTRAINT "LmsScheduleItem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LmsSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsScheduleItem" ADD CONSTRAINT "LmsScheduleItem_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGrade" ADD CONSTRAINT "LmsGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "LmsSchoolStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGrade" ADD CONSTRAINT "LmsGrade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LmsSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGrade" ADD CONSTRAINT "LmsGrade_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsHomework" ADD CONSTRAINT "LmsHomework_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LmsSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsHomework" ADD CONSTRAINT "LmsHomework_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsHomeworkSubmission" ADD CONSTRAINT "LmsHomeworkSubmission_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "LmsHomework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsHomeworkSubmission" ADD CONSTRAINT "LmsHomeworkSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "LmsSchoolStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsStudentAttendance" ADD CONSTRAINT "LmsStudentAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "LmsSchoolStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsStudentAttendance" ADD CONSTRAINT "LmsStudentAttendance_scheduleItemId_fkey" FOREIGN KEY ("scheduleItemId") REFERENCES "LmsScheduleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnswer" ADD CONSTRAINT "ExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

