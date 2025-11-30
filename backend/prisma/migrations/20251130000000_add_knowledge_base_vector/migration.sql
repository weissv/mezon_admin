-- Try to enable pgvector extension (may fail on some platforms)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'pgvector extension not available, using TEXT for embeddings';
END $$;

-- CreateTable with conditional vector type
DO $$
BEGIN
    -- Try to create table with vector type
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        CREATE TABLE IF NOT EXISTS "KnowledgeBaseDocument" (
            "id" SERIAL NOT NULL,
            "content" TEXT NOT NULL,
            "metadata" JSONB,
            "embedding" vector(768),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "KnowledgeBaseDocument_pkey" PRIMARY KEY ("id")
        );
    ELSE
        -- Fallback: create table without vector type (use TEXT for JSON array)
        CREATE TABLE IF NOT EXISTS "KnowledgeBaseDocument" (
            "id" SERIAL NOT NULL,
            "content" TEXT NOT NULL,
            "metadata" JSONB,
            "embedding" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "KnowledgeBaseDocument_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;
