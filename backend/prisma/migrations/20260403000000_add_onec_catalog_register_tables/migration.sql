-- CreateTable: OneCCatalog
CREATE TABLE "OneCCatalog" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "catalogType" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "parentRefKey" TEXT,
    "ownerRefKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OneCCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OneCRegister
CREATE TABLE "OneCRegister" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "registerType" TEXT NOT NULL,
    "registerKind" TEXT NOT NULL DEFAULT 'Information',
    "period" TIMESTAMP(3),
    "recorder" TEXT,
    "recorderType" TEXT,
    "lineNumber" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OneCRegister_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "OneCCatalog_catalogType_externalId_key" ON "OneCCatalog"("catalogType", "externalId");

-- CreateIndex
CREATE INDEX "OneCCatalog_catalogType_idx" ON "OneCCatalog"("catalogType");

-- CreateIndex
CREATE INDEX "OneCCatalog_catalogType_name_idx" ON "OneCCatalog"("catalogType", "name");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "OneCRegister_registerType_externalId_key" ON "OneCRegister"("registerType", "externalId");

-- CreateIndex
CREATE INDEX "OneCRegister_registerType_idx" ON "OneCRegister"("registerType");

-- CreateIndex
CREATE INDEX "OneCRegister_registerType_period_idx" ON "OneCRegister"("registerType", "period");

-- CreateIndex
CREATE INDEX "OneCRegister_recorder_idx" ON "OneCRegister"("recorder");
