CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "startDate" DATE,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "notes" VARCHAR(1000),
    "workoutId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlanItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Plan_userId_createdAt_idx"
    ON "Plan"("userId", "createdAt");
CREATE INDEX "PlanItem_planId_scheduledDate_idx"
    ON "PlanItem"("planId", "scheduledDate");
CREATE INDEX "PlanItem_scheduledDate_idx"
    ON "PlanItem"("scheduledDate");
CREATE UNIQUE INDEX "PlanItem_workoutId_key"
    ON "PlanItem"("workoutId");

ALTER TABLE "Plan"
    ADD CONSTRAINT "Plan_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlanItem"
    ADD CONSTRAINT "PlanItem_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "Plan"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlanItem"
    ADD CONSTRAINT "PlanItem_workoutId_fkey"
    FOREIGN KEY ("workoutId") REFERENCES "Workout"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
