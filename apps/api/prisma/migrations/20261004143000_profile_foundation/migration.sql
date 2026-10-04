CREATE TYPE "WeightUnit" AS ENUM ('KG', 'LB');

CREATE TABLE "Profile" (
    "userId" TEXT NOT NULL,
    "heightCm" DECIMAL(5,2),
    "weightUnit" "WeightUnit" NOT NULL DEFAULT 'KG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "Profile_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "Profile" ("userId", "createdAt", "updatedAt")
SELECT "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("userId") DO NOTHING;
