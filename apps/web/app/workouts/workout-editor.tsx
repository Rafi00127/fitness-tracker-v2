"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  createWorkout,
  deleteWorkout,
  getExercises,
  getProfile,
  getWorkout,
  updateWorkout,
  type WeightUnit,
} from "@/lib/fitness-api";
import { useAuthSession } from "../auth-session";
import { ProtectedAppShell } from "../protected-app-shell";

interface ExerciseOption {
  id: string;
  name: string;
  category: string | null;
}

interface ExerciseDraft {
  exerciseId: string;
  sets: string;
  reps: string;
  weight: string;
  durationSeconds: string;
  notes: string;
}

const emptyEntry = (exerciseId = ""): ExerciseDraft => ({
  exerciseId,
  sets: "",
  reps: "",
  weight: "",
  durationSeconds: "",
  notes: "",
});

function localDateTimeValue(value: Date): string {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function optionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

export function WorkoutEditor({ workoutId }: { workoutId?: string }) {
  const router = useRouter();
  const { session } = useAuthSession();
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("KG");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => localDateTimeValue(new Date()));
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<ExerciseDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    const workoutRequest = workoutId
      ? getWorkout(session, workoutId)
      : Promise.resolve(null);

    Promise.all([
      getExercises(session, { page: 1, limit: 100 }),
      getProfile(session),
      workoutRequest,
    ])
      .then(([exercisePage, profile, workout]) => {
        if (!isMounted) return;
        const workoutExercises =
          workout?.exerciseEntries.map((entry) => entry.exercise) ?? [];
        const allOptions = [
          ...exercisePage.items.map(({ id, name, category }) => ({
            id,
            name,
            category,
          })),
          ...workoutExercises,
        ];
        setExercises(
          allOptions.filter(
            (exercise, index) =>
              allOptions.findIndex(
                (candidate) => candidate.id === exercise.id,
              ) === index,
          ),
        );
        setWeightUnit(profile.profile.weightUnit);
        if (workout) {
          setTitle(workout.title);
          setDate(localDateTimeValue(new Date(workout.date)));
          setDurationMinutes(workout.durationMinutes?.toString() ?? "");
          setNotes(workout.notes ?? "");
          setEntries(
            workout.exerciseEntries.map((entry) => ({
              exerciseId: entry.exerciseId,
              sets: entry.sets?.toString() ?? "",
              reps: entry.reps?.toString() ?? "",
              weight: entry.weight?.toString() ?? "",
              durationSeconds: entry.durationSeconds?.toString() ?? "",
              notes: entry.notes ?? "",
            })),
          );
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (isMounted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load workout data.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [session, workoutId]);

  function updateEntry(
    index: number,
    field: keyof ExerciseDraft,
    value: string,
  ) {
    setEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setError("");
    setStatus("");
    setIsSaving(true);

    const workoutInput = {
      title: title.trim(),
      date: new Date(date).toISOString(),
      durationMinutes: optionalNumber(durationMinutes),
      notes: notes.trim() || null,
      exerciseEntries: entries.map((entry) => ({
        exerciseId: entry.exerciseId,
        sets: optionalNumber(entry.sets),
        reps: optionalNumber(entry.reps),
        weight: optionalNumber(entry.weight),
        durationSeconds: optionalNumber(entry.durationSeconds),
        notes: entry.notes.trim() || null,
      })),
    };

    try {
      if (workoutId) {
        await updateWorkout(session, workoutId, workoutInput);
        setStatus("Workout saved.");
      } else {
        const created = await createWorkout(session, workoutInput);
        router.push(`/workouts/${created.id}`);
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save the workout.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!session || !workoutId) return;
    setError("");
    try {
      await deleteWorkout(session, workoutId);
      router.push("/workouts");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to delete the workout.",
      );
      setConfirmDelete(false);
    }
  }

  return (
    <ProtectedAppShell>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <Link
          className="text-sm font-medium text-zinc-600 underline underline-offset-4"
          href={workoutId ? `/workouts/${workoutId}` : "/workouts"}
        >
          {workoutId ? "Back to workout" : "Back to workouts"}
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">
          {workoutId ? "Edit workout" : "Log a workout"}
        </h1>
        {error && (
          <p
            className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}
        {status && (
          <p
            className="mt-6 rounded-md bg-green-50 p-4 text-sm text-green-800"
            role="status"
          >
            {status}
          </p>
        )}
        {isLoading ? (
          <p className="mt-8 text-sm text-zinc-600" role="status">
            Loading workout form...
          </p>
        ) : (
          <form
            className="mt-8 space-y-6 rounded-xl border border-zinc-200 bg-white p-6"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="workout-title"
              >
                Workout title
              </label>
              <input
                className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                id="workout-title"
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                required
                value={title}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor="workout-date"
                >
                  Date and time
                </label>
                <input
                  className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                  id="workout-date"
                  onChange={(event) => setDate(event.target.value)}
                  required
                  type="datetime-local"
                  value={date}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor="workout-duration"
                >
                  Duration (minutes, optional)
                </label>
                <input
                  className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                  id="workout-duration"
                  min={1}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  type="number"
                  value={durationMinutes}
                />
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="workout-notes"
              >
                Workout notes (optional)
              </label>
              <textarea
                className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                id="workout-notes"
                maxLength={2000}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                value={notes}
              />
            </div>

            <section aria-labelledby="workout-exercises-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2
                    className="text-lg font-semibold"
                    id="workout-exercises-heading"
                  >
                    Exercises
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Set details are optional. Weight is entered in {weightUnit}.
                  </p>
                </div>
                <button
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
                  disabled={
                    entries.length >= 50 ||
                    !exercises.some(
                      (exercise) =>
                        !entries.some(
                          (entry) => entry.exerciseId === exercise.id,
                        ),
                    )
                  }
                  onClick={() => {
                    const availableExercise = exercises.find(
                      (exercise) =>
                        !entries.some(
                          (entry) => entry.exerciseId === exercise.id,
                        ),
                    );
                    if (availableExercise) {
                      setEntries((current) => [
                        ...current,
                        emptyEntry(availableExercise.id),
                      ]);
                    }
                  }}
                  type="button"
                >
                  Add exercise
                </button>
              </div>
              {exercises.length === 0 ? (
                <p className="mt-4 rounded-md bg-zinc-50 p-4 text-sm text-zinc-600">
                  Add an exercise to your catalog before attaching it to a
                  workout.{" "}
                  <Link
                    className="font-medium underline underline-offset-4"
                    href="/exercises"
                  >
                    Open exercises
                  </Link>
                </p>
              ) : entries.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-600">
                  No exercises added. You can save this workout as a general
                  activity or add exercise details.
                </p>
              ) : (
                <ol className="mt-4 space-y-4">
                  {entries.map((entry, index) => (
                    <li
                      className="space-y-4 rounded-lg border border-zinc-200 p-4"
                      key={`${entry.exerciseId}-${index}`}
                    >
                      <div className="flex items-end gap-3">
                        <div className="min-w-0 flex-1">
                          <label
                            className="block text-sm font-medium"
                            htmlFor={`entry-exercise-${index}`}
                          >
                            Exercise
                          </label>
                          <select
                            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                            id={`entry-exercise-${index}`}
                            onChange={(event) =>
                              updateEntry(
                                index,
                                "exerciseId",
                                event.target.value,
                              )
                            }
                            required
                            value={entry.exerciseId}
                          >
                            {exercises.map((exercise) => (
                              <option
                                disabled={entries.some(
                                  (other, otherIndex) =>
                                    otherIndex !== index &&
                                    other.exerciseId === exercise.id,
                                )}
                                key={exercise.id}
                                value={exercise.id}
                              >
                                {exercise.name}
                                {exercise.category
                                  ? ` (${exercise.category})`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          aria-label={`Remove exercise entry ${index + 1}`}
                          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                          onClick={() =>
                            setEntries((current) =>
                              current.filter(
                                (_, entryIndex) => entryIndex !== index,
                              ),
                            )
                          }
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <EntryNumberField
                          id={`entry-sets-${index}`}
                          label="Sets"
                          min={1}
                          onChange={(value) =>
                            updateEntry(index, "sets", value)
                          }
                          value={entry.sets}
                        />
                        <EntryNumberField
                          id={`entry-reps-${index}`}
                          label="Reps"
                          min={1}
                          onChange={(value) =>
                            updateEntry(index, "reps", value)
                          }
                          value={entry.reps}
                        />
                        <EntryNumberField
                          id={`entry-weight-${index}`}
                          label={`Weight (${weightUnit})`}
                          min={0}
                          step="0.01"
                          onChange={(value) =>
                            updateEntry(index, "weight", value)
                          }
                          value={entry.weight}
                        />
                        <EntryNumberField
                          id={`entry-duration-${index}`}
                          label="Duration (seconds)"
                          min={1}
                          onChange={(value) =>
                            updateEntry(index, "durationSeconds", value)
                          }
                          value={entry.durationSeconds}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium"
                          htmlFor={`entry-notes-${index}`}
                        >
                          Entry notes (optional)
                        </label>
                        <input
                          className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                          id={`entry-notes-${index}`}
                          maxLength={1000}
                          onChange={(event) =>
                            updateEntry(index, "notes", event.target.value)
                          }
                          value={entry.notes}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-5">
              <button
                className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving
                  ? "Saving..."
                  : workoutId
                    ? "Save workout"
                    : "Create workout"}
              </button>
              {workoutId &&
                (confirmDelete ? (
                  <>
                    <button
                      className="rounded-md border border-red-300 px-4 py-2.5 text-sm text-red-800"
                      onClick={() => void handleDelete()}
                      type="button"
                    >
                      Confirm delete workout
                    </button>
                    <button
                      className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm"
                      onClick={() => setConfirmDelete(false)}
                      type="button"
                    >
                      Keep workout
                    </button>
                  </>
                ) : (
                  <button
                    className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm"
                    onClick={() => setConfirmDelete(true)}
                    type="button"
                  >
                    Delete workout
                  </button>
                ))}
            </div>
          </form>
        )}
      </main>
    </ProtectedAppShell>
  );
}

function EntryNumberField({
  id,
  label,
  min,
  step,
  value,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  step?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
        id={id}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step={step ?? 1}
        type="number"
        value={value}
      />
    </div>
  );
}
