CREATE TABLE "NutritionEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" VARCHAR(120) NOT NULL,
    "caloriesKcal" INTEGER,
    "proteinGrams" DECIMAL(7,2),
    "carbsGrams" DECIMAL(7,2),
    "fatsGrams" DECIMAL(7,2),
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NutritionEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NutritionEntry_userId_date_idx"
    ON "NutritionEntry"("userId", "date");

ALTER TABLE "NutritionEntry"
    ADD CONSTRAINT "NutritionEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
