-- CreateTable
CREATE TABLE "OneCOrganization" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "inn" TEXT,
    "kpp" TEXT,
    "ogrn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCOrganization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCNomenclature" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCNomenclature_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCBankAccount" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT,
    "bankName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCBankAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCContract" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "contractorRefKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCContract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCEmployee" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "personRefKey" TEXT,
    "positionRefKey" TEXT,
    "orgRefKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCEmployee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCPosition" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCPosition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCFixedAsset" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCFixedAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCWarehouse" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCWarehouse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCCurrency" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCCurrency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCDepartment" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "parentRefKey" TEXT,
    "orgRefKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCDepartment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCDocument" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "documentNumber" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "posted" BOOLEAN NOT NULL DEFAULT false,
    "amount" DECIMAL(14,2),
    "contractorRefKey" TEXT,
    "contractorName" TEXT,
    "personRefKey" TEXT,
    "personName" TEXT,
    "operationType" TEXT,
    "comment" TEXT,
    "meta" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCHRDocument" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "documentNumber" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "posted" BOOLEAN NOT NULL DEFAULT false,
    "employeeRefKey" TEXT,
    "employeeName" TEXT,
    "personRefKey" TEXT,
    "personName" TEXT,
    "orgRefKey" TEXT,
    "departmentRefKey" TEXT,
    "positionRefKey" TEXT,
    "dateStart" TIMESTAMP(3),
    "dateEnd" TIMESTAMP(3),
    "amount" DECIMAL(14,2),
    "comment" TEXT,
    "meta" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCHRDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OneCPayrollDocument" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "documentNumber" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "posted" BOOLEAN NOT NULL DEFAULT false,
    "orgRefKey" TEXT,
    "departmentRefKey" TEXT,
    "period" TIMESTAMP(3),
    "amount" DECIMAL(14,2),
    "comment" TEXT,
    "meta" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OneCPayrollDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OneCOrganization_externalId_key" ON "OneCOrganization"("externalId");
CREATE UNIQUE INDEX "OneCNomenclature_externalId_key" ON "OneCNomenclature"("externalId");
CREATE INDEX "OneCNomenclature_name_idx" ON "OneCNomenclature"("name");
CREATE UNIQUE INDEX "OneCBankAccount_externalId_key" ON "OneCBankAccount"("externalId");
CREATE UNIQUE INDEX "OneCContract_externalId_key" ON "OneCContract"("externalId");
CREATE INDEX "OneCContract_contractorRefKey_idx" ON "OneCContract"("contractorRefKey");
CREATE UNIQUE INDEX "OneCEmployee_externalId_key" ON "OneCEmployee"("externalId");
CREATE INDEX "OneCEmployee_name_idx" ON "OneCEmployee"("name");
CREATE UNIQUE INDEX "OneCPosition_externalId_key" ON "OneCPosition"("externalId");
CREATE UNIQUE INDEX "OneCFixedAsset_externalId_key" ON "OneCFixedAsset"("externalId");
CREATE UNIQUE INDEX "OneCWarehouse_externalId_key" ON "OneCWarehouse"("externalId");
CREATE UNIQUE INDEX "OneCCurrency_externalId_key" ON "OneCCurrency"("externalId");
CREATE UNIQUE INDEX "OneCDepartment_externalId_key" ON "OneCDepartment"("externalId");
CREATE UNIQUE INDEX "OneCDocument_externalId_key" ON "OneCDocument"("externalId");
CREATE INDEX "OneCDocument_docType_date_idx" ON "OneCDocument"("docType", "date");
CREATE INDEX "OneCDocument_docType_idx" ON "OneCDocument"("docType");
CREATE INDEX "OneCDocument_contractorRefKey_idx" ON "OneCDocument"("contractorRefKey");
CREATE UNIQUE INDEX "OneCHRDocument_externalId_key" ON "OneCHRDocument"("externalId");
CREATE INDEX "OneCHRDocument_docType_date_idx" ON "OneCHRDocument"("docType", "date");
CREATE INDEX "OneCHRDocument_docType_idx" ON "OneCHRDocument"("docType");
CREATE INDEX "OneCHRDocument_employeeRefKey_idx" ON "OneCHRDocument"("employeeRefKey");
CREATE INDEX "OneCHRDocument_personRefKey_idx" ON "OneCHRDocument"("personRefKey");
CREATE UNIQUE INDEX "OneCPayrollDocument_externalId_key" ON "OneCPayrollDocument"("externalId");
CREATE INDEX "OneCPayrollDocument_docType_date_idx" ON "OneCPayrollDocument"("docType", "date");
CREATE INDEX "OneCPayrollDocument_docType_idx" ON "OneCPayrollDocument"("docType");
