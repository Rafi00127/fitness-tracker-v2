"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  createPlanItem,
  deletePlan,
  deletePlanItem,
  getPlan,
  getWorkouts,
  updatePlan,
  updatePlanItem,
  type PlanRecord,
  type WorkoutRecord,
} from "@/lib/fitness-api";
import { useAuthSession } from "../../auth-session";
import { ProtectedAppShell } from "../../protected-app-shell";

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const router = useRouter();
  const { session } = useAuthSession();
  const [plan, setPlan] = useState<PlanRecord | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [linkValues, setLinkValues] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refreshPlan = useCallback(async () => {
    if (!session) return;
    const result = await getPlan(session, planId);
    setPlan(result);
    setLinkValues({});
  }, [planId, session]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    Promise.all([
      getPlan(session, planId),
      getWorkouts(session, { page: 1, limit: 100 }),
    ])
      .then(([planResult, workoutResult]) => {
        if (active) {
          setPlan(planResult);
          setWorkouts(workoutResult.items);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load this plan.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [planId, session]);

  async function saveAction(
    action: () => Promise<void>,
    successMessage: string,
  ) {
    setError("");
    setMessage("");
    setIsSaving(true);
    try {
      await action();
      setMessage(successMessage);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save this change.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProtectedAppShell>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <Link
          className="text-sm font-medium text-zinc-600 underline underline-offset-4"
          href="/plans"
        >
          Back to plans and schedule
        </Link>

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
        {isLoading ? (
          <p className="mt-6 text-sm text-zinc-600" role="status">
            Loading plan...
          </p>
        ) : !plan ? (
          <p className="mt-6 text-sm text-zinc-600">Plan not found.</p>
        ) : (
          <>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">
              {plan.name}
            </h1>

            <form
              className="mt-6 grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!session) return;
                const form = new FormData(event.currentTarget);
                void saveAction(async () => {
                  await updatePlan(session, plan.id, {
                    name: String(form.get("name") ?? ""),
                    description: String(form.get("description") ?? "") || null,
                    startDate: String(form.get("startDate") ?? "") || null,
                    endDate: String(form.get("endDate") ?? "") || null,
                  });
                  await refreshPlan();
                }, "Plan updated.");
              }}
            >
              <h2 className="text-lg font-semibold text-zinc-950 sm:col-span-2">
                Plan details
              </h2>
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor="plan-name"
                >
                  Plan name
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  defaultValue={plan.name}
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
                  defaultValue={plan.description ?? ""}
                  id="plan-description"
                  maxLength={1000}
                  name="description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium" htmlFor="start">
                  Start date (optional)
                </label>
                <input
                  className="mt-1 rounded-md border border-zinc-300 px-3 py-2"
                  defaultValue={inputDate(plan.startDate)}
                  id="start"
                  name="startDate"
                  type="date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium" htmlFor="end">
                  End date (optional)
                </label>
                <input
                  className="mt-1 rounded-md border border-zinc-300 px-3 py-2"
                  defaultValue={inputDate(plan.endDate)}
                  id="end"
                  name="endDate"
                  type="date"
                />
              </div>
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  disabled={isSaving}
                  type="submit"
                >
                  Save plan
                </button>
                <button
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-800 disabled:opacity-50"
                  disabled={isSaving}
                  onClick={() => {
                    if (
                      !session ||
                      !window.confirm(
                        "Delete this plan and its scheduled sessions? Logged workouts will remain.",
                      )
                    )
                      return;
                    void saveAction(async () => {
                      await deletePlan(session, plan.id);
                      router.push("/plans");
                    }, "Plan deleted.");
                  }}
                  type="button"
                >
                  Delete plan
                </button>
              </div>
            </form>

            <form
              className="mt-8 grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!session) return;
                const form = new FormData(event.currentTarget);
                const formElement = event.currentTarget;
                void saveAction(async () => {
                  await createPlanItem(session, plan.id, {
                    title: String(form.get("title") ?? ""),
                    scheduledDate: String(form.get("scheduledDate") ?? ""),
                    notes: String(form.get("notes") ?? "") || null,
                  });
                  formElement.reset();
                  await refreshPlan();
                }, "Scheduled session added.");
              }}
            >
              <h2 className="text-lg font-semibold text-zinc-950 sm:col-span-2">
                Schedule a workout
              </h2>
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor="item-title"
                >
                  Session title
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  id="item-title"
                  maxLength={120}
                  name="title"
                  required
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium"
                  htmlFor="scheduled-date"
                >
                  Scheduled date
                </label>
                <input
                  className="mt-1 rounded-md border border-zinc-300 px-3 py-2"
                  id="scheduled-date"
                  name="scheduledDate"
                  required
                  type="date"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  className="block text-sm font-medium"
                  htmlFor="item-notes"
                >
                  Notes (optional)
                </label>
                <textarea
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                  id="item-notes"
                  maxLength={1000}
                  name="notes"
                  rows={2}
                />
              </div>
              <button
                className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2"
                disabled={isSaving}
                type="submit"
              >
                Add scheduled session
              </button>
            </form>

            <section aria-labelledby="sessions-heading" className="mt-10">
              <h2
                className="text-xl font-semibold text-zinc-950"
                id="sessions-heading"
              >
                Scheduled sessions
              </h2>
              {plan.items.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
                  No sessions scheduled in this plan yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {plan.items.map((item) => (
                    <li
                      className="rounded-xl border border-zinc-200 bg-white p-5"
                      key={item.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-zinc-950">
                            {item.title}
                          </h3>
                          <time className="mt-1 block text-sm text-zinc-600">
                            {displayDate(item.scheduledDate)}
                          </time>
                          {item.notes && (
                            <p className="mt-2 text-sm text-zinc-600">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-zinc-700">
                          {item.completed ? "Completed" : "Scheduled"}
                        </span>
                      </div>
                      {item.workout && (
                        <p className="mt-3 text-sm text-zinc-700">
                          Linked workout: {item.workout.title}
                        </p>
                      )}
                      {editingItemId === item.id && (
                        <form
                          className="mt-4 grid gap-3 rounded-lg bg-zinc-50 p-4 sm:grid-cols-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            if (!session) return;
                            const form = new FormData(event.currentTarget);
                            const input = {
                              title: String(form.get("title") ?? ""),
                              scheduledDate: String(
                                form.get("scheduledDate") ?? "",
                              ),
                              notes: String(form.get("notes") ?? "") || null,
                            };
                            void saveAction(async () => {
                              await updatePlanItem(
                                session,
                                plan.id,
                                item.id,
                                input,
                              );
                              setEditingItemId(null);
                              await refreshPlan();
                            }, "Scheduled session updated.");
                          }}
                        >
                          <div>
                            <label
                              className="block text-sm font-medium"
                              htmlFor={`edit-title-${item.id}`}
                            >
                              Session title
                            </label>
                            <input
                              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                              defaultValue={item.title}
                              id={`edit-title-${item.id}`}
                              maxLength={120}
                              name="title"
                              required
                            />
                          </div>
                          <div>
                            <label
                              className="block text-sm font-medium"
                              htmlFor={`edit-date-${item.id}`}
                            >
                              Scheduled date
                            </label>
                            <input
                              className="mt-1 rounded-md border border-zinc-300 px-3 py-2"
                              defaultValue={inputDate(item.scheduledDate)}
                              id={`edit-date-${item.id}`}
                              name="scheduledDate"
                              required
                              type="date"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label
                              className="block text-sm font-medium"
                              htmlFor={`edit-notes-${item.id}`}
                            >
                              Notes (optional)
                            </label>
                            <textarea
                              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
                              defaultValue={item.notes ?? ""}
                              id={`edit-notes-${item.id}`}
                              maxLength={1000}
                              name="notes"
                              rows={2}
                            />
                          </div>
                          <button
                            className="w-fit rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                            disabled={isSaving}
                            type="submit"
                          >
                            Save session changes
                          </button>
                        </form>
                      )}
                      <div className="mt-4 flex flex-wrap items-end gap-3">
                        <button
                          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
                          onClick={() =>
                            setEditingItemId(
                              editingItemId === item.id ? null : item.id,
                            )
                          }
                          type="button"
                        >
                          {editingItemId === item.id
                            ? "Cancel edit"
                            : "Edit session"}
                        </button>
                        <div>
                          <label
                            className="block text-sm font-medium"
                            htmlFor={`workout-${item.id}`}
                          >
                            Link a logged workout
                          </label>
                          <select
                            className="mt-1 max-w-full rounded-md border border-zinc-300 px-3 py-2"
                            id={`workout-${item.id}`}
                            onChange={(event) =>
                              setLinkValues((values) => ({
                                ...values,
                                [item.id]: event.target.value,
                              }))
                            }
                            value={linkValues[item.id] ?? item.workoutId ?? ""}
                          >
                            <option value="">No linked workout</option>
                            {workouts.map((workout) => (
                              <option key={workout.id} value={workout.id}>
                                {workout.title} — {displayDate(workout.date)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
                          disabled={isSaving}
                          onClick={() => {
                            if (!session) return;
                            const workoutId =
                              linkValues[item.id] ?? item.workoutId ?? "";
                            void saveAction(
                              async () => {
                                await updatePlanItem(
                                  session,
                                  plan.id,
                                  item.id,
                                  {
                                    workoutId: workoutId || null,
                                  },
                                );
                                await refreshPlan();
                              },
                              workoutId
                                ? "Workout linked."
                                : "Workout unlinked.",
                            );
                          }}
                          type="button"
                        >
                          Save workout link
                        </button>
                        {!item.workoutId && (
                          <button
                            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
                            disabled={isSaving}
                            onClick={() => {
                              if (!session) return;
                              void saveAction(
                                async () => {
                                  await updatePlanItem(
                                    session,
                                    plan.id,
                                    item.id,
                                    { completed: !item.completed },
                                  );
                                  await refreshPlan();
                                },
                                item.completed
                                  ? "Session marked incomplete."
                                  : "Session marked complete.",
                              );
                            }}
                            type="button"
                          >
                            {item.completed
                              ? "Mark incomplete"
                              : "Mark complete"}
                          </button>
                        )}
                        <button
                          className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-800 disabled:opacity-50"
                          disabled={isSaving}
                          onClick={() => {
                            if (
                              !session ||
                              !window.confirm("Delete this scheduled session?")
                            )
                              return;
                            void saveAction(async () => {
                              await deletePlanItem(session, plan.id, item.id);
                              await refreshPlan();
                            }, "Scheduled session deleted.");
                          }}
                          type="button"
                        >
                          Delete session
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </ProtectedAppShell>
  );
}

function inputDate(value: string | null): string {
  return value?.slice(0, 10) ?? "";
}

function displayDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString();
}
