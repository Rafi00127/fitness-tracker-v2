"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  createGoal,
  deleteGoal,
  getGoalProgress,
  getGoals,
  type GoalInput,
  type GoalMetric,
  type GoalProgress,
  type GoalRecord,
  updateGoal,
} from "@/lib/fitness-api";
import { useAuthSession } from "../auth-session";
import { ProtectedAppShell } from "../protected-app-shell";

const metricOptions: Array<{ value: GoalMetric; label: string; unit: string }> =
  [
    { value: "DAILY_WATER_ML", label: "Daily water intake", unit: "ml/day" },
    { value: "WEEKLY_WORKOUTS", label: "Workouts per week", unit: "workouts/week" },
    { value: "TARGET_WEIGHT_KG", label: "Target body weight", unit: "kg" },
  ];

function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDateString(date);
}

function metricLabel(metric: GoalMetric): string {
  return metricOptions.find((option) => option.value === metric)?.label ?? metric;
}

function unitFor(metric: GoalMetric): string {
  return metricOptions.find((option) => option.value === metric)?.unit ?? "";
}

function formattedValue(value: number | null, metric: GoalMetric): string {
  if (value === null) return "No recorded value";
  const digits = metric === "TARGET_WEIGHT_KG" ? 3 : 0;
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  })} ${unitFor(metric).replace("/day", "").replace("/week", "")}`;
}

function BarChart({
  title,
  unit,
  points,
}: {
  title: string;
  unit: string;
  points: Array<{ date: string; value: number }>;
}) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <figure className="rounded-xl border border-zinc-200 bg-white p-5">
      <figcaption className="font-semibold text-zinc-950">{title}</figcaption>
      {points.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600">No recorded data in this date range.</p>
      ) : (
        <>
          <div
            aria-label={`${title} chart`}
            className="mt-5 overflow-x-auto"
            role="img"
          >
            <div
              className="flex h-48 min-w-max items-end gap-2 border-b border-l border-zinc-300 px-2"
              style={{ minWidth: `${Math.max(points.length * 32, 240)}px` }}
            >
              {points.map((point, index) => (
                <div
                  className="flex h-full w-7 flex-col items-center justify-end"
                  key={`${point.date}-${index}`}
                  title={`${point.date}: ${point.value.toLocaleString()} ${unit}`}
                >
                  <div
                    className="w-5 rounded-t bg-blue-700"
                    style={{ height: `${Math.max((point.value / max) * 88, 2)}%` }}
                  />
                  <span className="mt-2 whitespace-nowrap text-[10px] text-zinc-600">
                    {point.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <table className="sr-only">
            <caption>{title} recorded values</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Value ({unit})</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => (
                <tr key={`table-${point.date}-${index}`}>
                  <td>{point.date}</td>
                  <td>{point.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </figure>
  );
}

export default function GoalsPage() {
  const { session } = useAuthSession();
  const today = utcDateString(new Date());
  const initialFrom = shiftDate(today, -29);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [metric, setMetric] = useState<GoalMetric>("DAILY_WATER_ML");
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(today);
  const [activeRange, setActiveRange] = useState({ from: initialFrom, to: today });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    Promise.all([
      getGoals(session, { limit: 100 }),
      getGoalProgress(session, activeRange),
    ])
      .then(([goalResult, chartData]) => {
        if (isMounted) {
          setGoals(goalResult.items);
          setProgress(chartData);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (isMounted) {
          setError(cause instanceof Error ? cause.message : "Unable to load goals and progress.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [session, activeRange, reloadKey]);

  const selectedMetric = metricOptions.find((item) => item.value === metric)!;
  const weightPoints =
    progress?.weight.filter(
      (point): point is { date: string; value: number } =>
        point.value !== null,
    ) ?? [];

  function resetForm() {
    setEditingId(null);
    setMetric("DAILY_WATER_ML");
    setTitle("");
    setTargetValue("");
    setTargetDate("");
  }

  function beginEdit(goal: GoalRecord) {
    setEditingId(goal.id);
    setMetric(goal.metric);
    setTitle(goal.title);
    setTargetValue(String(goal.targetValue));
    setTargetDate(goal.targetDate?.slice(0, 10) ?? "");
    setError("");
    setStatus("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setError("");
    setStatus("");
    setSaving(true);
    const input: GoalInput = {
      title: title.trim(),
      metric,
      targetValue: Number(targetValue),
      targetDate: targetDate || null,
    };
    try {
      if (editingId) {
        await updateGoal(session, editingId, {
          title: input.title,
          targetValue: input.targetValue,
          targetDate: input.targetDate,
        });
        setStatus("Goal updated.");
      } else {
        await createGoal(session, input);
        setStatus("Goal saved.");
      }
      resetForm();
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save goal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(goal: GoalRecord) {
    if (!session || !window.confirm(`Delete the goal "${goal.title}"?`)) return;
    setError("");
    try {
      await deleteGoal(session, goal.id);
      if (editingId === goal.id) resetForm();
      setStatus("Goal deleted.");
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete goal.");
    }
  }

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!from || !to || from > to) {
      setError("Choose a valid date range with a start date on or before the end date.");
      return;
    }
    setError("");
    setLoading(true);
    setActiveRange({ from, to });
  }

  return (
    <ProtectedAppShell>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <Link className="text-sm font-medium text-zinc-600 underline underline-offset-4" href="/dashboard">
          Back to dashboard
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">Goals &amp; progress</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Progress is calculated from your water, workout, and measurement history.
        </p>
        {error && <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {status && <p className="mt-6 rounded-md bg-green-50 p-4 text-sm text-green-800" role="status">{status}</p>}

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <form className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6" onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold">{editingId ? "Edit goal" : "Create a goal"}</h2>
            <div>
              <label className="block text-sm font-medium" htmlFor="goal-title">Goal name</label>
              <input className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" id="goal-title" maxLength={100} onChange={(event) => setTitle(event.target.value)} required value={title} />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="goal-metric">Track</label>
              <select className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" disabled={Boolean(editingId)} id="goal-metric" onChange={(event) => setMetric(event.target.value as GoalMetric)} value={metric}>
                {metricOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="goal-target">Target ({selectedMetric.unit})</label>
              <input className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" id="goal-target" max={metric === "DAILY_WATER_ML" ? 100000 : metric === "WEEKLY_WORKOUTS" ? 7 : 9999.99} min={metric === "WEEKLY_WORKOUTS" || metric === "DAILY_WATER_ML" ? 1 : 0.001} onChange={(event) => setTargetValue(event.target.value)} required step={metric === "TARGET_WEIGHT_KG" ? 0.001 : 1} type="number" value={targetValue} />
              {metric === "TARGET_WEIGHT_KG" && !editingId && (
                <p className="mt-1 text-xs text-zinc-600">The latest recorded weight sets the starting point and determines the goal direction.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="goal-date">Target date (optional)</label>
              <input className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" id="goal-date" onChange={(event) => setTargetDate(event.target.value)} type="date" value={targetDate} />
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={saving} type="submit">
                {saving ? "Saving..." : editingId ? "Save changes" : "Save goal"}
              </button>
              {editingId && <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm" onClick={resetForm} type="button">Cancel edit</button>}
            </div>
          </form>

          <section aria-labelledby="goal-list-heading" className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold" id="goal-list-heading">Your goals</h2>
            {loading ? (
              <p className="mt-4 text-sm text-zinc-600" role="status">Loading goals...</p>
            ) : goals.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-600">No goals yet. Create one to see progress from your existing tracking records.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {goals.map((goal) => (
                  <li className="rounded-lg border border-zinc-200 p-4" key={goal.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-zinc-950">{goal.title}</h3>
                        <p className="mt-1 text-sm text-zinc-600">{metricLabel(goal.metric)} · target {formattedValue(goal.targetValue, goal.metric)}</p>
                      </div>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800">{goal.status.toLowerCase()}</span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-700">
                      Current: <strong>{formattedValue(goal.currentValue, goal.metric)}</strong>
                      {goal.metric === "TARGET_WEIGHT_KG" && goal.startingWeightKg !== null && (
                        <span> · Started at {formattedValue(goal.startingWeightKg, goal.metric)}</span>
                      )}
                    </p>
                    <label className="sr-only" htmlFor={`goal-progress-${goal.id}`}>{goal.title} progress</label>
                    <progress className="mt-2 h-2 w-full accent-blue-700" id={`goal-progress-${goal.id}`} max={100} value={goal.progressPercent ?? 0} />
                    <p className="text-xs text-zinc-600">{goal.progressPercent === null ? "Add a weight measurement to calculate progress." : `${goal.progressPercent}% complete`}</p>
                    <div className="mt-3 flex gap-3">
                      <button className="text-sm font-medium text-zinc-700 underline underline-offset-4" onClick={() => beginEdit(goal)} type="button">Edit</button>
                      <button className="text-sm font-medium text-red-700 underline underline-offset-4" onClick={() => void handleDelete(goal)} type="button">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>

        <section aria-labelledby="progress-heading" className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-950" id="progress-heading">Progress history</h2>
          <p className="mt-1 text-sm text-zinc-600">Charts contain recorded values only; days without an entry are not treated as zero.</p>
          <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={applyRange}>
            <div>
              <label className="block text-xs font-medium" htmlFor="progress-from">From</label>
              <input className="mt-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm" id="progress-from" onChange={(event) => setFrom(event.target.value)} required type="date" value={from} />
            </div>
            <div>
              <label className="block text-xs font-medium" htmlFor="progress-to">To</label>
              <input className="mt-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm" id="progress-to" onChange={(event) => setTo(event.target.value)} required type="date" value={to} />
            </div>
            <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm" type="submit">Apply</button>
          </form>
          {loading ? (
            <p className="mt-5 text-sm text-zinc-600" role="status">Loading progress history...</p>
          ) : progress && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <BarChart points={progress.water} title="Daily water intake" unit="ml" />
              <BarChart points={progress.workouts} title="Workouts logged by day" unit="workouts" />
              <BarChart points={weightPoints} title="Recorded body weight" unit="kg" />
            </div>
          )}
        </section>
      </main>
    </ProtectedAppShell>
  );
}
