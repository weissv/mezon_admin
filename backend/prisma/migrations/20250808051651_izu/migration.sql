-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('DIRECTOR', 'DEPUTY', 'ADMIN', 'TEACHER', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "public"."ChildStatus" AS ENUM ('ACTIVE', 'LEFT');

-- CreateEnum
CREATE TYPE "public"."ClubEnrollmentStatus" AS ENUM ('ACTIVE', 'WAITING_LIST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."FinanceType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."FinanceCategory" AS ENUM ('NUTRITION', 'CLUBS', 'MAINTENANCE', 'SALARY');

-- CreateEnum
CREATE TYPE "public"."InventoryType" AS ENUM ('FOOD', 'SUPPLIES');

-- CreateEnum
CREATE TYPE "public"."MaintenanceStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "public"."MaintenanceType" AS ENUM ('REPAIR', 'PURCHASE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Employee" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "position" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "fireDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "medicalCheckupDate" TIMESTAMP(3),
    "attestationDate" TIMESTAMP(3),
    "branchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Child" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "groupId" INTEGER NOT NULL,
    "healthInfo" TEXT,
    "status" "public"."ChildStatus" NOT NULL DEFAULT 'ACTIVE',
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Club" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teacherId" INTEGER NOT NULL,
    "schedule" JSONB,
    "cost" DECIMAL(12,2) NOT NULL,
    "maxStudents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClubEnrollment" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "clubId" INTEGER NOT NULL,
    "status" "public"."ClubEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "childId" INTEGER NOT NULL,
    "clubId" INTEGER,
    "isPresent" BOOLEAN NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FinanceTransaction" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "type" "public"."FinanceType" NOT NULL,
    "category" "public"."FinanceCategory" NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "type" "public"."InventoryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Menu" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "meals" JSONB NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaintenanceRequest" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requesterId" INTEGER NOT NULL,
    "status" "public"."MaintenanceStatus" NOT NULL DEFAULT 'NEW',
    "type" "public"."MaintenanceType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecurityLog" (
    "id" SERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Branch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActionLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "public"."User"("employeeId");

-- CreateIndex
CREATE INDEX "Employee_branchId_idx" ON "public"."Employee"("branchId");

-- CreateIndex
CREATE INDEX "Child_groupId_idx" ON "public"."Child"("groupId");

-- CreateIndex
CREATE INDEX "Group_branchId_idx" ON "public"."Group"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_branchId_key" ON "public"."Group"("name", "branchId");

-- CreateIndex
CREATE INDEX "Club_teacherId_idx" ON "public"."Club"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Club_name_teacherId_key" ON "public"."Club"("name", "teacherId");

-- CreateIndex
CREATE INDEX "ClubEnrollment_clubId_idx" ON "public"."ClubEnrollment"("clubId");

-- CreateIndex
CREATE INDEX "ClubEnrollment_childId_idx" ON "public"."ClubEnrollment"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubEnrollment_childId_clubId_key" ON "public"."ClubEnrollment"("childId", "clubId");

-- CreateIndex
CREATE INDEX "Attendance_childId_idx" ON "public"."Attendance"("childId");

-- CreateIndex
CREATE INDEX "Attendance_clubId_idx" ON "public"."Attendance"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_date_childId_clubId_key" ON "public"."Attendance"("date", "childId", "clubId");

-- CreateIndex
CREATE INDEX "FinanceTransaction_type_category_date_idx" ON "public"."FinanceTransaction"("type", "category", "date");

-- CreateIndex
CREATE INDEX "InventoryItem_type_expiryDate_idx" ON "public"."InventoryItem"("type", "expiryDate");

-- CreateIndex
CREATE INDEX "Menu_date_idx" ON "public"."Menu"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Menu_date_ageGroup_key" ON "public"."Menu"("date", "ageGroup");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_requesterId_status_type_idx" ON "public"."MaintenanceRequest"("requesterId", "status", "type");

-- CreateIndex
CREATE INDEX "SecurityLog_date_eventType_idx" ON "public"."SecurityLog"("date", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "public"."Branch"("name");

-- CreateIndex
CREATE INDEX "ActionLog_userId_action_timestamp_idx" ON "public"."ActionLog"("userId", "action", "timestamp");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Child" ADD CONSTRAINT "Child_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Club" ADD CONSTRAINT "Club_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClubEnrollment" ADD CONSTRAINT "ClubEnrollment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClubEnrollment" ADD CONSTRAINT "ClubEnrollment_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "public"."Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "public"."Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionLog" ADD CONSTRAINT "ActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
