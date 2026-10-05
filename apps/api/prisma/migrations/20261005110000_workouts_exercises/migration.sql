CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(60),
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "notes" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkoutExercise" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "weight" DECIMAL(7,2),
    "durationSeconds" INTEGER,
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Exercise_userId_name_idx" ON "Exercise"("userId", "name");
CREATE INDEX "Workout_userId_date_idx" ON "Workout"("userId", "date");
CREATE INDEX "WorkoutExercise_workoutId_idx" ON "WorkoutExercise"("workoutId");
CREATE INDEX "WorkoutExercise_exerciseId_idx" ON "WorkoutExercise"("exerciseId");

ALTER TABLE "Exercise"
    ADD CONSTRAINT "Exercise_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Workout"
    ADD CONSTRAINT "Workout_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutExercise"
    ADD CONSTRAINT "WorkoutExercise_workoutId_fkey"
    FOREIGN KEY ("workoutId") REFERENCES "Workout"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutExercise"
    ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey"
    FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
