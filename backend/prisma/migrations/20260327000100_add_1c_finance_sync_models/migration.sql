-- Add enum value for existing finance category
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FinanceCategory') THEN
        ALTER TYPE "FinanceCategory" ADD VALUE IF NOT EXISTS 'OTHER';
    END IF;
END
$$;

-- Create new enums for 1C finance integration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionChannel') THEN
        CREATE TYPE "TransactionChannel" AS ENUM ('CASH', 'BANK');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvoiceDirection') THEN
        CREATE TYPE "InvoiceDirection" AS ENUM ('INCOMING', 'OUTGOING');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BalanceType') THEN
        CREATE TYPE "BalanceType" AS ENUM ('CASH', 'BANK', 'CONTRACTOR_DEBT');
    END IF;
END
$$;

-- New reference tables from 1C
CREATE TABLE IF NOT EXISTS "Contractor" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "inn" TEXT,
    "kpp" TEXT,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Person" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CashFlowArticle" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashFlowArticle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "direction" "InvoiceDirection" NOT NULL,
    "documentNumber" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "posted" BOOLEAN NOT NULL DEFAULT false,
    "operationType" TEXT,
    "contractorId" INTEGER,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BalanceSnapshot" (
    "id" SERIAL NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "balanceType" "BalanceType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "contractorId" INTEGER,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- Extend existing finance transactions for 1C sync
ALTER TABLE "FinanceTransaction"
    ADD COLUMN IF NOT EXISTS "externalId" TEXT,
    ADD COLUMN IF NOT EXISTS "channel" "TransactionChannel",
    ADD COLUMN IF NOT EXISTS "documentNumber" TEXT,
    ADD COLUMN IF NOT EXISTS "operationType" TEXT,
    ADD COLUMN IF NOT EXISTS "posted" BOOLEAN,
    ADD COLUMN IF NOT EXISTS "counterpartyType" TEXT,
    ADD COLUMN IF NOT EXISTS "counterpartyRefKey" TEXT,
    ADD COLUMN IF NOT EXISTS "contractorId" INTEGER,
    ADD COLUMN IF NOT EXISTS "personId" INTEGER,
    ADD COLUMN IF NOT EXISTS "cashFlowArticleId" INTEGER,
    ADD COLUMN IF NOT EXISTS "purpose" TEXT;

ALTER TABLE "FinanceTransaction"
    ALTER COLUMN "category" SET DEFAULT 'OTHER';

-- Uniques and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Contractor_externalId_key" ON "Contractor"("externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "Person_externalId_key" ON "Person"("externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "CashFlowArticle_externalId_key" ON "CashFlowArticle"("externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_externalId_key" ON "Invoice"("externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "FinanceTransaction_externalId_key" ON "FinanceTransaction"("externalId");

CREATE INDEX IF NOT EXISTS "Contractor_inn_idx" ON "Contractor"("inn");
CREATE INDEX IF NOT EXISTS "Contractor_name_idx" ON "Contractor"("name");
CREATE INDEX IF NOT EXISTS "Person_name_idx" ON "Person"("name");
CREATE INDEX IF NOT EXISTS "Invoice_direction_date_idx" ON "Invoice"("direction", "date");
CREATE INDEX IF NOT EXISTS "Invoice_contractorId_idx" ON "Invoice"("contractorId");
CREATE INDEX IF NOT EXISTS "BalanceSnapshot_snapshotDate_balanceType_idx" ON "BalanceSnapshot"("snapshotDate", "balanceType");
CREATE INDEX IF NOT EXISTS "BalanceSnapshot_contractorId_idx" ON "BalanceSnapshot"("contractorId");
CREATE INDEX IF NOT EXISTS "FinanceTransaction_channel_date_idx" ON "FinanceTransaction"("channel", "date");
CREATE INDEX IF NOT EXISTS "FinanceTransaction_contractorId_idx" ON "FinanceTransaction"("contractorId");
CREATE INDEX IF NOT EXISTS "FinanceTransaction_personId_idx" ON "FinanceTransaction"("personId");
CREATE INDEX IF NOT EXISTS "FinanceTransaction_cashFlowArticleId_idx" ON "FinanceTransaction"("cashFlowArticleId");

-- Foreign keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FinanceTransaction_contractorId_fkey') THEN
        ALTER TABLE "FinanceTransaction"
            ADD CONSTRAINT "FinanceTransaction_contractorId_fkey"
            FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FinanceTransaction_personId_fkey') THEN
        ALTER TABLE "FinanceTransaction"
            ADD CONSTRAINT "FinanceTransaction_personId_fkey"
            FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FinanceTransaction_cashFlowArticleId_fkey') THEN
        ALTER TABLE "FinanceTransaction"
            ADD CONSTRAINT "FinanceTransaction_cashFlowArticleId_fkey"
            FOREIGN KEY ("cashFlowArticleId") REFERENCES "CashFlowArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_contractorId_fkey') THEN
        ALTER TABLE "Invoice"
            ADD CONSTRAINT "Invoice_contractorId_fkey"
            FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BalanceSnapshot_contractorId_fkey') THEN
        ALTER TABLE "BalanceSnapshot"
            ADD CONSTRAINT "BalanceSnapshot_contractorId_fkey"
            FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;