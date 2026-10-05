"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  createNutritionEntry,
  deleteNutritionEntry,
  getNutritionEntries,
  getNutritionSummary,
  updateNutritionEntry,
  type NutritionEntryRecord,
  type NutritionSummary,
  type NutritionValueSummary,
} from "@/lib/fitness-api";
import { useAuthSession } from "../auth-session";
import { ProtectedAppShell } from "../protected-app-shell";

function localDateString(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function dateOffset(value: string, offset: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return localDateString(date);
}

function optionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function NutritionTotal({
  label,
  summary,
  unit,
}: {
  label: string;
  summary: NutritionValueSummary;
  unit: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 p-4">
      <h3 className="text-sm font-medium text-zinc-600">{label}</h3>
      <p className="mt-1 text-lg font-semibold text-zinc-950">
        {summary.recordedEntryCount === 0
          ? "No recorded values"
          : `${summary.total.toLocaleString()} ${unit}`}
      </p>
      <p className="mt-1 text-xs text-zinc-600">
        {summary.recordedEntryCount} entr
        {summary.recordedEntryCount === 1 ? "y" : "ies"} with a recorded value
      </p>
    </div>
  );
}

export default function NutritionPage() {
  const { session } = useAuthSession();
  const today = localDateString(new Date());
  const initialFrom = dateOffset(today, -6);
  const [entries, setEntries] = useState<NutritionEntryRecord[]>([]);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(today);
  const [activeRange, setActiveRange] = useState({
    from: initialFrom,
    to: today,
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [caloriesKcal, setCaloriesKcal] = useState("");
  const [proteinGrams, setProteinGrams] = useState("");
  const [carbsGrams, setCarbsGrams] = useState("");
  const [fatsGrams, setFatsGrams] = useState("");
  const [notes, setNotes] = useState("");
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
      getNutritionEntries(session, {
        ...activeRange,
        page,
        limit: 20,
      }),
      getNutritionSummary(session, activeRange),
    ])
      .then(([listResult, summaryResult]) => {
        if (isMounted) {
          setEntries(listResult.items);
          setPagination(listResult.pagination);
          setSummary(summaryResult);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (isMounted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load nutrition entries.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [session, activeRange, page, reloadKey]);

  function resetForm() {
    setEditingId(null);
    setDate(today);
    setDescription("");
    setCaloriesKcal("");
    setProteinGrams("");
    setCarbsGrams("");
    setFatsGrams("");
    setNotes("");
  }

  function editEntry(entry: NutritionEntryRecord) {
    setEditingId(entry.id);
    setDate(entry.date.slice(0, 10));
    setDescription(entry.description);
    setCaloriesKcal(entry.caloriesKcal?.toString() ?? "");
    setProteinGrams(entry.proteinGrams?.toString() ?? "");
    setCarbsGrams(entry.carbsGrams?.toString() ?? "");
    setFatsGrams(entry.fatsGrams?.toString() ?? "");
    setNotes(entry.notes ?? "");
    setError("");
    setStatus("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setError("");
    setStatus("");
    setSaving(true);
    try {
      const input = {
        date,
        description: description.trim(),
        caloriesKcal: optionalNumber(caloriesKcal),
        proteinGrams: optionalNumber(proteinGrams),
        carbsGrams: optionalNumber(carbsGrams),
        fatsGrams: optionalNumber(fatsGrams),
        notes: notes.trim() || null,
      };
      if (editingId) {
        await updateNutritionEntry(session, editingId, input);
        setStatus("Nutrition entry updated.");
      } else {
        await createNutritionEntry(session, input);
        setStatus("Nutrition entry saved.");
      }
      resetForm();
      setLoading(true);
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save nutrition entry.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry: NutritionEntryRecord) {
    if (
      !session ||
      !window.confirm(`Delete the nutrition entry "${entry.description}"?`)
    ) {
      return;
    }
    setError("");
    setStatus("");
    try {
      await deleteNutritionEntry(session, entry.id);
      if (editingId === entry.id) resetForm();
      setStatus("Nutrition entry deleted.");
      setLoading(true);
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to delete nutrition entry.",
      );
    }
  }

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (from > to) {
      setError("Start date must be on or before end date.");
      return;
    }
    setError("");
    setLoading(true);
    setPage(1);
    setActiveRange({ from, to });
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
          Nutrition log
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Record meals and the nutrition values you know. Totals include only
          values you have recorded; this log does not estimate missing values.
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

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form
            className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6"
            onSubmit={handleSubmit}
          >
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit nutrition entry" : "Log a meal"}
            </h2>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="nutrition-date"
              >
                Date
              </label>
              <input
                className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                id="nutrition-date"
                onChange={(event) => setDate(event.target.value)}
                required
                type="date"
                value={date}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="nutrition-description"
              >
                Meal or intake description
              </label>
              <input
                className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                id="nutrition-description"
                maxLength={120}
                onChange={(event) => setDescription(event.target.value)}
                required
                value={description}
              />
            </div>
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-3 text-sm font-medium">
                Nutrition values (optional)
              </legend>
              <NumberField
                id="nutrition-calories"
                label="Calories (kcal)"
                max={10000}
                onChange={setCaloriesKcal}
                step={1}
                value={caloriesKcal}
              />
              <NumberField
                id="nutrition-protein"
                label="Protein (g)"
                max={1000}
                onChange={setProteinGrams}
                step={0.01}
                value={proteinGrams}
              />
              <NumberField
                id="nutrition-carbs"
                label="Carbohydrates (g)"
                max={1000}
                onChange={setCarbsGrams}
                step={0.01}
                value={carbsGrams}
              />
              <NumberField
                id="nutrition-fat"
                label="Fat (g)"
                max={1000}
                onChange={setFatsGrams}
                step={0.01}
                value={fatsGrams}
              />
            </fieldset>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="nutrition-notes"
              >
                Notes (optional)
              </label>
              <textarea
                className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                id="nutrition-notes"
                maxLength={1000}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                value={notes}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={saving}
                type="submit"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Save nutrition entry"}
              </button>
              {editingId && (
                <button
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm"
                  onClick={resetForm}
                  type="button"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <section
            aria-labelledby="nutrition-history-heading"
            className="rounded-xl border border-zinc-200 bg-white p-6"
          >
            <h2
              className="text-lg font-semibold"
              id="nutrition-history-heading"
            >
              Nutrition history
            </h2>
            <form
              className="mt-4 flex flex-wrap items-end gap-3"
              onSubmit={applyRange}
            >
              <DateField
                id="nutrition-from"
                label="From"
                onChange={setFrom}
                value={from}
              />
              <DateField
                id="nutrition-to"
                label="To"
                onChange={setTo}
                value={to}
              />
              <button
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                type="submit"
              >
                Apply
              </button>
            </form>

            {summary && (
              <div
                aria-label="Nutrition totals for recorded values"
                className="mt-5 grid gap-3 sm:grid-cols-2"
              >
                <NutritionTotal
                  label="Calories"
                  summary={summary.caloriesKcal}
                  unit="kcal"
                />
                <NutritionTotal
                  label="Protein"
                  summary={summary.proteinGrams}
                  unit="g"
                />
                <NutritionTotal
                  label="Carbohydrates"
                  summary={summary.carbsGrams}
                  unit="g"
                />
                <NutritionTotal
                  label="Fat"
                  summary={summary.fatsGrams}
                  unit="g"
                />
              </div>
            )}
            <p className="mt-4 text-xs text-zinc-600">
              {summary
                ? `${summary.entryCount} entr${summary.entryCount === 1 ? "y" : "ies"} in this date range.`
                : "Totals reflect recorded values in the selected date range."}
            </p>

            {loading ? (
              <p className="mt-5 text-sm text-zinc-600" role="status">
                Loading nutrition history...
              </p>
            ) : entries.length === 0 ? (
              <p className="mt-5 text-sm text-zinc-600">
                No nutrition entries for this date range.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-zinc-100">
                {entries.map((entry) => (
                  <li
                    className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    key={entry.id}
                  >
                    <div className="min-w-0">
                      <time
                        className="text-xs text-zinc-600"
                        dateTime={entry.date}
                      >
                        {entry.date.slice(0, 10)}
                      </time>
                      <h3 className="font-medium text-zinc-950">
                        {entry.description}
                      </h3>
                      <p className="text-sm text-zinc-600">
                        {nutritionValues(entry)}
                        {entry.notes ? ` · ${entry.notes}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="text-sm underline underline-offset-4"
                        onClick={() => editEntry(entry)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="text-sm text-red-700 underline underline-offset-4"
                        onClick={() => void handleDelete(entry)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {pagination.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                <button
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    setLoading(true);
                    setPage((current) => current - 1);
                  }}
                  type="button"
                >
                  Previous
                </button>
                <p className="text-sm text-zinc-600">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <button
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => {
                    setLoading(true);
                    setPage((current) => current + 1);
                  }}
                  type="button"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </section>
      </main>
    </ProtectedAppShell>
  );
}

function NumberField({
  id,
  label,
  max,
  onChange,
  step,
  value,
}: {
  id: string;
  label: string;
  max: number;
  onChange: (value: string) => void;
  step: number;
  value: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
        id={id}
        max={max}
        min={0}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="number"
        value={value}
      />
    </div>
  );
}

function DateField({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        className="mt-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        required
        type="date"
        value={value}
      />
    </div>
  );
}

function nutritionValues(entry: NutritionEntryRecord): string {
  const values = [
    entry.caloriesKcal === null
      ? null
      : `${entry.caloriesKcal.toLocaleString()} kcal`,
    entry.proteinGrams === null
      ? null
      : `${entry.proteinGrams.toLocaleString()} g protein`,
    entry.carbsGrams === null
      ? null
      : `${entry.carbsGrams.toLocaleString()} g carbs`,
    entry.fatsGrams === null
      ? null
      : `${entry.fatsGrams.toLocaleString()} g fat`,
  ].filter((value): value is string => value !== null);
  return values.length === 0 ? "No nutrient values recorded" : values.join(" · ");
}
