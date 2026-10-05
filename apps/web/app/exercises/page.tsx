"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  createExercise,
  deleteExercise,
  getExercises,
  updateExercise,
  type ExerciseRecord,
} from "@/lib/fitness-api";
import { useAuthSession } from "../auth-session";
import { ProtectedAppShell } from "../protected-app-shell";

const pageSize = 20;

export default function ExercisesPage() {
  const { session } = useAuthSession();
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    getExercises(session, { q: activeQuery, page, limit: pageSize })
      .then((result) => {
        if (isMounted) {
          setExercises(result.items);
          setTotalPages(result.pagination.totalPages);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (isMounted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load exercises.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [session, activeQuery, page, reloadKey]);

  function clearForm() {
    setEditingId(null);
    setName("");
    setCategory("");
    setNotes("");
  }

  function startEditing(exercise: ExerciseRecord) {
    setEditingId(exercise.id);
    setName(exercise.name);
    setCategory(exercise.category ?? "");
    setNotes(exercise.notes ?? "");
    setStatus("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setError("");
    setStatus("");
    setIsSaving(true);
    try {
      const input = {
        name: name.trim(),
        category: category.trim() || null,
        notes: notes.trim() || null,
      };
      if (editingId) {
        await updateExercise(session, editingId, input);
        setStatus("Exercise updated.");
      } else {
        await createExercise(session, input);
        setStatus("Exercise created.");
        setPage(1);
      }
      clearForm();
      setReloadKey((value) => value + 1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save the exercise.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(exercise: ExerciseRecord) {
    if (!session) return;
    setError("");
    setStatus("");
    try {
      await deleteExercise(session, exercise.id);
      setConfirmDeleteId(null);
      setStatus("Exercise deleted.");
      if (editingId === exercise.id) clearForm();
      setReloadKey((value) => value + 1);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to delete the exercise.",
      );
    }
  }

  return (
    <ProtectedAppShell>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <Link
          className="text-sm font-medium text-zinc-600 underline underline-offset-4"
          href="/dashboard"
        >
          Back to dashboard
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">
          Exercises
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Manage your private exercise catalog for workout logs.
        </p>

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

        <section aria-labelledby="exercise-form-heading" className="mt-8">
          <h2 id="exercise-form-heading" className="text-xl font-semibold">
            {editingId ? "Edit exercise" : "Add an exercise"}
          </h2>
          <form
            className="mt-4 grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="exercise-name"
              >
                Name
              </label>
              <input
                className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                id="exercise-name"
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="exercise-category"
              >
                Category (optional)
              </label>
              <input
                className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                id="exercise-category"
                maxLength={60}
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                className="block text-sm font-medium"
                htmlFor="exercise-notes"
              >
                Notes (optional)
              </label>
              <textarea
                className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                id="exercise-notes"
                maxLength={1000}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                value={notes}
              />
            </div>
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button
                className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving
                  ? "Saving..."
                  : editingId
                    ? "Save exercise"
                    : "Add exercise"}
              </button>
              {editingId && (
                <button
                  className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium"
                  onClick={clearForm}
                  type="button"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section aria-labelledby="exercise-list-heading" className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="exercise-list-heading" className="text-xl font-semibold">
                Your exercise catalog
              </h2>
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setActiveQuery(query.trim());
              }}
            >
              <label className="sr-only" htmlFor="exercise-search">
                Search exercises
              </label>
              <input
                className="rounded-md border border-zinc-300 px-3 py-2"
                id="exercise-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or category"
                value={query}
              />
              <button
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
                type="submit"
              >
                Search
              </button>
            </form>
          </div>

          {isLoading && (
            <p className="mt-5 text-sm text-zinc-600" role="status">
              Loading exercises...
            </p>
          )}
          {!isLoading && exercises.length === 0 && (
            <p className="mt-5 rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
              No exercises found. Add an exercise above to use it in a workout.
            </p>
          )}
          <ul className="mt-4 space-y-3">
            {exercises.map((exercise) => (
              <li
                className="rounded-xl border border-zinc-200 bg-white p-5"
                key={exercise.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-zinc-950">
                      {exercise.name}
                    </h3>
                    {exercise.category && (
                      <p className="mt-1 text-sm text-zinc-600">
                        {exercise.category}
                      </p>
                    )}
                    {exercise.notes && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                      onClick={() => startEditing(exercise)}
                      type="button"
                    >
                      Edit {exercise.name}
                    </button>
                    {confirmDeleteId === exercise.id ? (
                      <>
                        <button
                          className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-800"
                          onClick={() => void handleDelete(exercise)}
                          type="button"
                        >
                          Confirm delete {exercise.name}
                        </button>
                        <button
                          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                          onClick={() => setConfirmDeleteId(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                        onClick={() => setConfirmDeleteId(exercise.id)}
                        type="button"
                      >
                        Delete {exercise.name}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav
              aria-label="Exercise pages"
              className="mt-6 flex items-center gap-3"
            >
              <button
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((value) => value - 1)}
                type="button"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-600">
                Page {page} of {totalPages}
              </span>
              <button
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((value) => value + 1)}
                type="button"
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </main>
    </ProtectedAppShell>
  );
}
