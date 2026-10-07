"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  createPlan,
  getPlans,
  getPlanSchedule,
  type PlanScheduleRecord,
  type PlanSummaryRecord,
} from "@/lib/fitness-api";
import { useAuthSession } from "../auth-session";
import { ProtectedAppShell } from "../protected-app-shell";

export default function PlansPage() {
  const { session } = useAuthSession();
  const [plans, setPlans] = useState<PlanSummaryRecord[]>([]);
  const [schedule, setSchedule] = useState<PlanScheduleRecord[]>([]);
  const [view, setView] = useState<"upcoming" | "history">("upcoming");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPlans = useCallback(async () => {
    if (!session) return;
    const [planResult, scheduleResult] = await Promise.all([
      getPlans(session),
      getPlanSchedule(session, view),
    ]);
    setPlans(planResult.items);
    setSchedule(scheduleResult.items);
  }, [session, view]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    Promise.all([getPlans(session), getPlanSchedule(session, view)])
      .then(([planResult, scheduleResult]) => {
        if (active) {
          setPlans(planResult.items);
          setSchedule(scheduleResult.items);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Unable to load plans.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session, view]);

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
          Plans and schedule
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Organize dated workout sessions. Dates are calendar days; recurring
          schedules are not supported.
        </p>

        {error && (
          <p
            className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 text-sm text-green-800" role="status">
            {message}
          </p>
        )}

        <form
          className="mt-8 grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!session) return;
            const form = new FormData(event.currentTarget);
            const formElement = event.currentTarget;
            setIsSaving(true);
            setError("");
            setMessage("");
            try {
              await createPlan(session, {
                name: String(form.get("name") ?? ""),
                description: String(form.get("description") ?? "") || null,
                startDate: String(form.get("startDate") ?? "") || null,
                endDate: String(form.get("endDate") ?? "") || null,
              });
              formElement.reset();
              setMessage("Training plan created.");
              await loadPlans();
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Unable to create plan.",
              );
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <h2 className="text-lg font-semibold text-zinc-950 sm:col-span-2">
            Create a plan
          </h2>
          <div>
            <label className="block text-sm font-medium" htmlFor="plan-name">
              Plan name
            </label>
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              id="plan-name"
              maxLength={100}
              name="name"
              required
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium"
              htmlFor="plan-description"
            >
              Description (optional)
            </label>
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              id="plan-description"
              maxLength={1000}
              name="description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="plan-start">
              Start date (optional)
            </label>
            <input
              className="mt-1 rounded-md border border-zinc-300 px-3 py-2"
              id="plan-start"
              name="startDate"
              type="date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="plan-end">
              End date (optional)
            </label>
            <input
              className="mt-1 rounded-md border border-zinc-300 px-3 py-2"
              id="plan-end"
              name="endDate"
              type="date"
            />
          </div>
          <button
            className="w-fit rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Creating..." : "Create plan"}
          </button>
        </form>

        <section aria-labelledby="plans-heading" className="mt-10">
          <h2
            className="text-xl font-semibold text-zinc-950"
            id="plans-heading"
          >
            Your plans
          </h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-zinc-600" role="status">
              Loading plans...
            </p>
          ) : plans.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
              No plans yet. Create one to start scheduling sessions.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {plans.map((plan) => (
                <li key={plan.id}>
                  <Link
                    className="block rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400"
                    href={`/plans/${plan.id}`}
                  >
                    <h3 className="font-semibold text-zinc-950">{plan.name}</h3>
                    {plan.description && (
                      <p className="mt-1 text-sm text-zinc-600">
                        {plan.description}
                      </p>
                    )}
                    <p className="mt-3 text-sm text-zinc-600">
                      {plan.itemCount} scheduled{" "}
                      {plan.itemCount === 1 ? "session" : "sessions"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="schedule-heading" className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              className="text-xl font-semibold text-zinc-950"
              id="schedule-heading"
            >
              {view === "upcoming" ? "Upcoming sessions" : "Schedule history"}
            </h2>
            <div aria-label="Schedule view" className="flex gap-2">
              <button
                aria-pressed={view === "upcoming"}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm aria-pressed:bg-zinc-900 aria-pressed:text-white"
                onClick={() => {
                  if (view !== "upcoming") {
                    setIsLoading(true);
                    setView("upcoming");
                  }
                }}
                type="button"
              >
                Upcoming
              </button>
              <button
                aria-pressed={view === "history"}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm aria-pressed:bg-zinc-900 aria-pressed:text-white"
                onClick={() => {
                  if (view !== "history") {
                    setIsLoading(true);
                    setView("history");
                  }
                }}
                type="button"
              >
                History
              </button>
            </div>
          </div>
          {isLoading ? (
            <p className="mt-4 text-sm text-zinc-600" role="status">
              Loading schedule...
            </p>
          ) : schedule.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
              No {view === "upcoming" ? "upcoming" : "historical"} sessions.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {schedule.map((item) => (
                <li
                  className="rounded-xl border border-zinc-200 bg-white p-5"
                  key={item.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-zinc-950">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        {item.plan.name}
                      </p>
                    </div>
                    <time className="text-sm text-zinc-600">
                      {displayDate(item.scheduledDate)}
                    </time>
                  </div>
                  <p className="mt-3 text-sm text-zinc-700">
                    {item.completed ? "Completed" : "Scheduled"}
                    {item.workout
                      ? ` · Logged workout: ${item.workout.title}`
                      : ""}
                  </p>
                  <Link
                    className="mt-2 inline-block text-sm font-medium text-zinc-700 underline underline-offset-4"
                    href={`/plans/${item.plan.id}`}
                  >
                    Manage plan
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </ProtectedAppShell>
  );
}

function displayDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString();
}
