CREATE TABLE IF NOT EXISTS "DashboardPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "layout" JSONB NOT NULL DEFAULT '[]',
    "enabledWidgets" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "collapsedSections" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "pinnedActions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "widgetFilters" JSONB NOT NULL DEFAULT '{}',
    "savedViews" JSONB NOT NULL DEFAULT '[]',
    "activeView" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DashboardPreference_userId_key" ON "DashboardPreference"("userId");
CREATE INDEX IF NOT EXISTS "DashboardPreference_userId_idx" ON "DashboardPreference"("userId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'DashboardPreference_userId_fkey'
          AND table_name = 'DashboardPreference'
    ) THEN
        ALTER TABLE "DashboardPreference"
        ADD CONSTRAINT "DashboardPreference_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;CREATE TABLE IF NOT EXISTS "DashboardPreference" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "layout" JSONB NOT NULL DEFAULT '[]',
  "enabledWidgets" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "collapsedSections" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "pinnedActions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "widgetFilters" JSONB NOT NULL DEFAULT '{}',
  "savedViews" JSONB NOT NULL DEFAULT '[]',
  "activeView" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DashboardPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DashboardPreference_userId_key" ON "DashboardPreference"("userId");
CREATE INDEX IF NOT EXISTS "DashboardPreference_userId_idx" ON "DashboardPreference"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'DashboardPreference_userId_fkey'
      AND table_name = 'DashboardPreference'
  ) THEN
    ALTER TABLE "DashboardPreference"
    ADD CONSTRAINT "DashboardPreference_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
