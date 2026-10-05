"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getDashboardSummary,
  getGoals,
  type DashboardSummary,
  type GoalRecord,
} from "@/lib/fitness-api";
import { useAuthSession } from "../auth-session";
import { ProtectedAppShell } from "../protected-app-shell";

const moduleNames: Record<
  DashboardSummary["trackingModules"][number]["key"],
  string
> = {
  workouts: "Workouts",
  water: "Water",
  measurements: "Measurements",
  goals: "Goals",
  nutrition: "Nutrition",
};

export default function DashboardPage() {
  const { session } = useAuthSession();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [error, setError] = useState("");
  const [goalsError, setGoalsError] = useState("");

  useEffect(() => {
    if (!session) {
      return;
    }

    let isMounted = true;
    getDashboardSummary(session)
      .then((result) => {
        if (isMounted) {
          setSummary(result);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (isMounted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load your dashboard.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    getGoals(session, { limit: 3 })
      .then((result) => {
        if (isMounted) {
          setGoals(result.items);
          setGoalsError("");
        }
      })
      .catch((cause: unknown) => {
        if (isMounted) {
          setGoalsError(
            cause instanceof Error ? cause.message : "Unable to load goals.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setGoalsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [session]);

  return (
    <ProtectedAppShell>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Your fitness
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-600">
          A private overview of your account and fitness activity.
        </p>

        {error && (
          <p
            className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}

        {!summary && !error && (
          <p className="mt-8 text-sm text-zinc-600" role="status">
            Loading your dashboard...
          </p>
        )}

        {summary && (
          <>
            <section aria-labelledby="overview-heading" className="mt-8">
              <h2 id="overview-heading" className="sr-only">
                Account overview
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-xl border border-zinc-200 bg-white p-5">
                  <h3 className="text-sm font-medium text-zinc-600">
                    Profile setup
                  </h3>
                  <p className="mt-2 text-xl font-semibold text-zinc-950">
                    {summary.profileComplete
                      ? "Basics added"
                      : "Needs a few details"}
                  </p>
                  <Link
                    className="mt-3 inline-block text-sm font-medium text-zinc-700 underline underline-offset-4"
                    href="/profile"
                  >
                    Review profile
                  </Link>
                </article>
                <article className="rounded-xl border border-zinc-200 bg-white p-5">
                  <h3 className="text-sm font-medium text-zinc-600">Account</h3>
                  <p className="mt-2 break-all text-xl font-semibold text-zinc-950">
                    {summary.user.name || summary.user.email}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {summary.user.email}
                  </p>
                </article>
              </div>
            </section>

            <section aria-labelledby="tracking-heading" className="mt-10">
              <h2
                id="tracking-heading"
                className="text-xl font-semibold text-zinc-950"
              >
                Tracking features
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Your private tracking tools and goal progress.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {summary.trackingModules.map((item) => (
                  <article
                    className="rounded-xl border border-zinc-200 bg-white p-5"
                    key={item.key}
                  >
                    <h3 className="font-medium text-zinc-950">
                      {moduleNames[item.key]}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-600">
                      {item.available
                        ? "Available now"
                        : `Available in Phase ${item.plannedPhase}`}
                    </p>
                    {item.key === "workouts" && item.available && (
                      <Link
                        className="mt-3 inline-block text-sm font-medium text-zinc-700 underline underline-offset-4"
                        href="/workouts"
                      >
                        View workouts
                      </Link>
                    )}
                    {item.key === "water" && item.available && (
                      <Link
                        className="mt-3 inline-block text-sm font-medium text-zinc-700 underline underline-offset-4"
                        href="/water"
                      >
                        View water log
                      </Link>
                    )}
                    {item.key === "measurements" && item.available && (
                      <Link
                        className="mt-3 inline-block text-sm font-medium text-zinc-700 underline underline-offset-4"
                        href="/measurements"
                      >
                        View measurements
                      </Link>
                    )}
                    {item.key === "goals" && item.available && (
                      <Link
                        className="mt-3 inline-block text-sm font-medium text-zinc-700 underline underline-offset-4"
                        href="/goals"
                      >
                        View goals
                      </Link>
                    )}
                    {item.key === "nutrition" && item.available && (
                      <Link
                        className="mt-3 inline-block text-sm font-medium text-zinc-700 underline underline-offset-4"
                        href="/nutrition"
                      >
                        View nutrition log
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="goals-overview-heading" className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2
                  className="text-xl font-semibold text-zinc-950"
                  id="goals-overview-heading"
                >
                  Goal progress
                </h2>
                <Link
                  className="text-sm font-medium text-zinc-700 underline underline-offset-4"
                  href="/goals"
                >
                  Manage goals
                </Link>
              </div>
              {goalsLoading ? (
                <p className="mt-4 text-sm text-zinc-600" role="status">
                  Loading goals...
                </p>
              ) : goalsError ? (
                <p className="mt-4 text-sm text-red-800" role="alert">
                  {goalsError}
                </p>
              ) : goals.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white p-5 text-sm text-zinc-600">
                  Create a goal to see automatically calculated progress here.
                </p>
              ) : (
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {goals.map((goal) => (
                    <li
                      className="rounded-xl border border-zinc-200 bg-white p-5"
                      key={goal.id}
                    >
                      <h3 className="font-medium text-zinc-950">{goal.title}</h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        {goal.currentValue === null
                          ? "Record a weight measurement to see progress."
                          : `${goal.currentValue.toLocaleString()} of ${goal.targetValue.toLocaleString()} · ${goal.status.toLowerCase()}`}
                      </p>
                      <label className="sr-only" htmlFor={`dashboard-goal-${goal.id}`}>
                        {goal.title} progress
                      </label>
                      <progress
                        className="mt-3 h-2 w-full accent-blue-700"
                        id={`dashboard-goal-${goal.id}`}
                        max={100}
                        value={goal.progressPercent ?? 0}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="recent-heading" className="mt-10">
              <h2
                id="recent-heading"
                className="text-xl font-semibold text-zinc-950"
              >
                Recent activity
              </h2>
              <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white p-6">
                {summary.recentActivity.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    Your workout history will appear here after you log a
                    workout.
                  </p>
                ) : (
                  <ul aria-label="Recent activity" className="space-y-3">
                    {summary.recentActivity.map((activity) => (
                      <li
                        className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-3 last:border-0 last:pb-0"
                        key={activity.id}
                      >
                        <div>
                          <Link
                            className="font-medium text-zinc-950 underline underline-offset-4"
                            href={`/workouts/${activity.id}`}
                          >
                            {activity.title}
                          </Link>
                          <p className="mt-1 text-sm text-zinc-600">
                            {activity.exercises.length
                              ? activity.exercises.join(", ")
                              : "No exercises added"}
                          </p>
                        </div>
                        <time
                          className="text-sm text-zinc-600"
                          dateTime={activity.date}
                        >
                          {new Date(activity.date).toLocaleDateString()}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </ProtectedAppShell>
  );
}
