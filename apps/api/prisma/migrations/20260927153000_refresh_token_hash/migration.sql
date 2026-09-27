CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RefreshToken_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

DO $migration$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'RefreshToken'
          AND column_name = 'token'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'RefreshToken'
          AND column_name = 'tokenHash'
    ) THEN
        ALTER TABLE "RefreshToken" RENAME COLUMN "token" TO "tokenHash";
        UPDATE "RefreshToken"
        SET "tokenHash" = encode(digest("tokenHash", 'sha256'), 'hex'),
            "revokedAt" = COALESCE("revokedAt", CURRENT_TIMESTAMP);
    END IF;

    IF to_regclass(
        format('%I.%I', current_schema(), 'RefreshToken_token_key')
    ) IS NOT NULL AND to_regclass(
        format('%I.%I', current_schema(), 'RefreshToken_tokenHash_key')
    ) IS NULL THEN
        ALTER INDEX "RefreshToken_token_key"
        RENAME TO "RefreshToken_tokenHash_key";
    END IF;
END
$migration$;

CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_tokenHash_key"
    ON "RefreshToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx"
    ON "RefreshToken"("userId");
