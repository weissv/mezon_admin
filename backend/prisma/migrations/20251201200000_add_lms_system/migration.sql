-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'TEXT', 'INTERACTIVE', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'SUSPENDED', 'DROPPED');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('QUIZ', 'TEST', 'HOMEWORK', 'PROJECT');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'GRADED', 'RETURNED');

-- CreateTable
CREATE TABLE "LmsCourse" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER NOT NULL,
    "estimatedDuration" INTEGER,
    "level" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsModule" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsLesson" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" "LessonType" NOT NULL DEFAULT 'TEXT',
    "videoUrl" TEXT,
    "duration" INTEGER,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsAttachment" (
    "id" SERIAL NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsEnrollment" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),

    CONSTRAINT "LmsEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsLessonProgress" (
    "id" SERIAL NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "LmsLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsAssignment" (
    "id" SERIAL NOT NULL,
    "lessonId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssignmentType" NOT NULL DEFAULT 'HOMEWORK',
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "dueDate" TIMESTAMP(3),
    "timeLimit" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsQuestion" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB,
    "points" INTEGER NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LmsQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsSubmission" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "content" JSONB,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "gradedBy" INTEGER,

    CONSTRAINT "LmsSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsCertificate" (
    "id" SERIAL NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "pdfUrl" TEXT,

    CONSTRAINT "LmsCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsAnnouncement" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsDiscussionThread" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER,
    "lessonId" INTEGER,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsDiscussionThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsDiscussionMessage" (
    "id" SERIAL NOT NULL,
    "threadId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsDiscussionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LmsCourse_authorId_idx" ON "LmsCourse"("authorId");

-- CreateIndex
CREATE INDEX "LmsCourse_status_idx" ON "LmsCourse"("status");

-- CreateIndex
CREATE INDEX "LmsModule_courseId_idx" ON "LmsModule"("courseId");

-- CreateIndex
CREATE INDEX "LmsLesson_moduleId_idx" ON "LmsLesson"("moduleId");

-- CreateIndex
CREATE INDEX "LmsAttachment_lessonId_idx" ON "LmsAttachment"("lessonId");

-- CreateIndex
CREATE INDEX "LmsEnrollment_userId_idx" ON "LmsEnrollment"("userId");

-- CreateIndex
CREATE INDEX "LmsEnrollment_courseId_idx" ON "LmsEnrollment"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsEnrollment_courseId_userId_key" ON "LmsEnrollment"("courseId", "userId");

-- CreateIndex
CREATE INDEX "LmsLessonProgress_enrollmentId_idx" ON "LmsLessonProgress"("enrollmentId");

-- CreateIndex
CREATE INDEX "LmsLessonProgress_lessonId_idx" ON "LmsLessonProgress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsLessonProgress_enrollmentId_lessonId_key" ON "LmsLessonProgress"("enrollmentId", "lessonId");

-- CreateIndex
CREATE INDEX "LmsAssignment_lessonId_idx" ON "LmsAssignment"("lessonId");

-- CreateIndex
CREATE INDEX "LmsQuestion_assignmentId_idx" ON "LmsQuestion"("assignmentId");

-- CreateIndex
CREATE INDEX "LmsSubmission_assignmentId_idx" ON "LmsSubmission"("assignmentId");

-- CreateIndex
CREATE INDEX "LmsSubmission_enrollmentId_idx" ON "LmsSubmission"("enrollmentId");

-- CreateIndex
CREATE INDEX "LmsCertificate_enrollmentId_idx" ON "LmsCertificate"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsCertificate_certificateNumber_key" ON "LmsCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "LmsAnnouncement_courseId_idx" ON "LmsAnnouncement"("courseId");

-- CreateIndex
CREATE INDEX "LmsDiscussionThread_courseId_idx" ON "LmsDiscussionThread"("courseId");

-- CreateIndex
CREATE INDEX "LmsDiscussionThread_authorId_idx" ON "LmsDiscussionThread"("authorId");

-- CreateIndex
CREATE INDEX "LmsDiscussionMessage_threadId_idx" ON "LmsDiscussionMessage"("threadId");

-- CreateIndex
CREATE INDEX "LmsDiscussionMessage_authorId_idx" ON "LmsDiscussionMessage"("authorId");

-- AddForeignKey
ALTER TABLE "LmsModule" ADD CONSTRAINT "LmsModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLesson" ADD CONSTRAINT "LmsLesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "LmsModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsAttachment" ADD CONSTRAINT "LmsAttachment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LmsLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsEnrollment" ADD CONSTRAINT "LmsEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLessonProgress" ADD CONSTRAINT "LmsLessonProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "LmsEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLessonProgress" ADD CONSTRAINT "LmsLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LmsLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsAssignment" ADD CONSTRAINT "LmsAssignment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LmsLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsQuestion" ADD CONSTRAINT "LmsQuestion_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "LmsAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsSubmission" ADD CONSTRAINT "LmsSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "LmsAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsSubmission" ADD CONSTRAINT "LmsSubmission_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "LmsEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCertificate" ADD CONSTRAINT "LmsCertificate_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "LmsEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsAnnouncement" ADD CONSTRAINT "LmsAnnouncement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsDiscussionThread" ADD CONSTRAINT "LmsDiscussionThread_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsDiscussionMessage" ADD CONSTRAINT "LmsDiscussionMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "LmsDiscussionThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
