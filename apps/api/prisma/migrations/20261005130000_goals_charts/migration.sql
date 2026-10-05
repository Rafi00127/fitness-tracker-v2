CREATE TYPE "GoalMetric" AS ENUM (
    'DAILY_WATER_ML',
    'WEEKLY_WORKOUTS',
    'TARGET_WEIGHT_KG'
);

CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "metric" "GoalMetric" NOT NULL,
    "targetValue" DECIMAL(10,3) NOT NULL,
    "targetDate" DATE,
    "startingWeightKg" DECIMAL(7,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Goal_userId_createdAt_idx" ON "Goal"("userId", "createdAt");

ALTER TABLE "Goal"
    ADD CONSTRAINT "Goal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
