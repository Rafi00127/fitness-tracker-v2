"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWorkouts, type WorkoutRecord } from "@/lib/fitness-api";
import { useAuthSession } from "../auth-session";
import { ProtectedAppShell } from "../protected-app-shell";

const pageSize = 20;

export default function WorkoutsPage() {
  const { session } = useAuthSession();
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeRange, setActiveRange] = useState({ from: "", to: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    getWorkouts(session, {
      from: activeRange.from
        ? new Date(`${activeRange.from}T00:00:00`).toISOString()
        : undefined,
      to: activeRange.to
        ? new Date(`${activeRange.to}T23:59:59.999`).toISOString()
        : undefined,
      page,
      limit: pageSize,
    })
      .then((result) => {
        if (isMounted) {
          setWorkouts(result.items);
          setTotalPages(result.pagination.totalPages);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (isMounted) {
          setError(
            cause instanceof Error ? cause.message : "Unable to load workouts.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [session, activeRange, page]);

  return (
    <ProtectedAppShell>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <Link
          className="text-sm font-medium text-zinc-600 underline underline-offset-4"
          href="/dashboard"
        >
          Back to dashboard
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Workouts
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Your private workout history.
            </p>
          </div>
          <Link
            className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
            href="/workouts/new"
          >
            Log a workout
          </Link>
        </div>

        {error && (
          <p
            className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}

        <form
          className="mt-8 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setActiveRange({ from, to });
          }}
        >
          <div>
            <label className="block text-sm font-medium" htmlFor="workout-from">
              From
            </label>
            <input
              className="mt-1 rounded-md border border-zinc-300 px-3 py-2"
              id="workout-from"
              onChange={(event) => setFrom(event.target.value)}
              type="date"
              value={from}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="workout-to">
              To
            </label>
            <input
              className="mt-1 rounded-md border border-zinc-300 px-3 py-2"
              id="workout-to"
              onChange={(event) => setTo(event.target.value)}
              type="date"
              value={to}
            />
          </div>
          <button
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
            type="submit"
          >
            Filter
          </button>
          <button
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 underline underline-offset-4"
            onClick={() => {
              setFrom("");
              setTo("");
              setPage(1);
              setActiveRange({ from: "", to: "" });
            }}
            type="button"
          >
            Clear dates
          </button>
        </form>

        {isLoading && (
          <p className="mt-6 text-sm text-zinc-600" role="status">
            Loading workouts...
          </p>
        )}
        {!isLoading && workouts.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 p-8">
            <p className="font-medium text-zinc-900">No workouts found.</p>
            <p className="mt-1 text-sm text-zinc-600">
              Log a workout to start building your history.
            </p>
          </div>
        )}
        <ul className="mt-5 space-y-3">
          {workouts.map((workout) => (
            <li key={workout.id}>
              <Link
                className="block rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400"
                href={`/workouts/${workout.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-zinc-950">
                      {workout.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      {workout.exerciseEntries.length
                        ? workout.exerciseEntries
                            .map((entry) => entry.exercise.name)
                            .join(", ")
                        : "No exercises added"}
                    </p>
                  </div>
                  <time
                    className="text-sm text-zinc-600"
                    dateTime={workout.date}
                  >
                    {new Date(workout.date).toLocaleString()}
                  </time>
                </div>
                {workout.durationMinutes !== null && (
                  <p className="mt-3 text-sm text-zinc-600">
                    Duration: {workout.durationMinutes} minutes
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
        {totalPages > 1 && (
          <nav
            aria-label="Workout pages"
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
      </main>
    </ProtectedAppShell>
  );
}
