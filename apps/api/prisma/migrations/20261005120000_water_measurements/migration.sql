CREATE TABLE "WaterEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amountMl" INTEGER NOT NULL,
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WaterEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weightKg" DECIMAL(7,3),
    "waistCm" DECIMAL(7,2),
    "chestCm" DECIMAL(7,2),
    "hipCm" DECIMAL(7,2),
    "bicepsCm" DECIMAL(7,2),
    "bodyFatPercent" DECIMAL(5,2),
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaterEntry_userId_date_key" ON "WaterEntry"("userId", "date");
CREATE INDEX "Measurement_userId_date_idx" ON "Measurement"("userId", "date");

ALTER TABLE "WaterEntry"
    ADD CONSTRAINT "WaterEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Measurement"
    ADD CONSTRAINT "Measurement_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
