"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  createMeasurement,
  deleteMeasurement,
  getMeasurements,
  getProfile,
  updateMeasurement,
  type MeasurementInput,
  type MeasurementRecord,
  type WeightUnit,
} from "@/lib/fitness-api";
import { useAuthSession } from "../auth-session";
import { ProtectedAppShell } from "../protected-app-shell";

type MetricKey = Exclude<keyof MeasurementInput, "date" | "notes">;

const metricFields: { key: MetricKey; label: string; unit: string }[] = [
  { key: "weightKg", label: "Weight", unit: "weight" },
  { key: "waistCm", label: "Waist", unit: "cm" },
  { key: "chestCm", label: "Chest", unit: "cm" },
  { key: "hipCm", label: "Hip", unit: "cm" },
  { key: "bicepsCm", label: "Biceps", unit: "cm" },
  { key: "bodyFatPercent", label: "Body fat", unit: "%" },
];

function localDateString(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function optionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function toKg(value: number | null, unit: WeightUnit): number | null {
  if (value === null) return null;
  return unit === "LB" ? Number((value / 2.2046226218).toFixed(3)) : value;
}

function fromKg(value: number | null, unit: WeightUnit): number | null {
  if (value === null) return null;
  return unit === "LB" ? Number((value * 2.2046226218).toFixed(2)) : value;
}

function metricValue(
  record: MeasurementRecord,
  field: MetricKey,
  unit: WeightUnit,
): number | null {
  const value = record[field];
  return field === "weightKg" ? fromKg(value, unit) : value;
}

export default function MeasurementsPage() {
  const { session } = useAuthSession();
  const today = localDateString(new Date());
  const [items, setItems] = useState<MeasurementRecord[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("KG");
  const [date, setDate] = useState(today);
  const [values, setValues] = useState<Record<MetricKey, string>>({
    weightKg: "",
    waistCm: "",
    chestCm: "",
    hipCm: "",
    bicepsCm: "",
    bodyFatPercent: "",
  });
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
      getMeasurements(session, { limit: 100 }),
      getProfile(session),
    ])
      .then(([result, profile]) => {
        if (isMounted) {
          setItems(result.items);
          setWeightUnit(profile.profile.weightUnit);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (isMounted) {
          setError(cause instanceof Error ? cause.message : "Unable to load measurements.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [session, reloadKey]);

  function resetForm() {
    setEditingId(null);
    setDate(today);
    setValues({
      weightKg: "",
      waistCm: "",
      chestCm: "",
      hipCm: "",
      bicepsCm: "",
      bodyFatPercent: "",
    });
    setNotes("");
  }

  function editMeasurement(item: MeasurementRecord) {
    setEditingId(item.id);
    setDate(item.date.slice(0, 10));
    setValues({
      weightKg: fromKg(item.weightKg, weightUnit)?.toString() ?? "",
      waistCm: item.waistCm?.toString() ?? "",
      chestCm: item.chestCm?.toString() ?? "",
      hipCm: item.hipCm?.toString() ?? "",
      bicepsCm: item.bicepsCm?.toString() ?? "",
      bodyFatPercent: item.bodyFatPercent?.toString() ?? "",
    });
    setNotes(item.notes ?? "");
    setError("");
    setStatus("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setError("");
    setStatus("");
    const input: MeasurementInput = {
      date,
      weightKg: toKg(optionalNumber(values.weightKg), weightUnit),
      waistCm: optionalNumber(values.waistCm),
      chestCm: optionalNumber(values.chestCm),
      hipCm: optionalNumber(values.hipCm),
      bicepsCm: optionalNumber(values.bicepsCm),
      bodyFatPercent: optionalNumber(values.bodyFatPercent),
      notes: notes.trim() || null,
    };
    if (metricFields.every(({ key }) => input[key] === null)) {
      setError("Enter at least one measurement value.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateMeasurement(session, editingId, input);
        setStatus("Measurement updated.");
      } else {
        await createMeasurement(session, input);
        setStatus("Measurement saved.");
      }
      resetForm();
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save measurement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: MeasurementRecord) {
    if (!session || !window.confirm(`Delete the measurement recorded on ${item.date.slice(0, 10)}?`)) return;
    setError("");
    try {
      await deleteMeasurement(session, item.id);
      if (editingId === item.id) resetForm();
      setStatus("Measurement deleted.");
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete measurement.");
    }
  }

  const latest = items[0];
  const previous = items[1];

  return (
    <ProtectedAppShell>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <Link className="text-sm font-medium text-zinc-600 underline underline-offset-4" href="/dashboard">
          Back to dashboard
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">Measurements</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Record body measurements over time. Weight is stored in kilograms; your profile preference controls its display unit.
        </p>
        {error && <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {status && <p className="mt-6 rounded-md bg-green-50 p-4 text-sm text-green-800" role="status">{status}</p>}

        {latest && (
          <section aria-labelledby="comparison-heading" className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold" id="comparison-heading">Latest compared with previous</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {latest.date.slice(0, 10)}{previous ? ` compared with ${previous.date.slice(0, 10)}` : " — add another entry to see changes"}
            </p>
            {previous && (
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {metricFields.map(({ key, label, unit }) => {
                  const current = metricValue(latest, key, weightUnit);
                  const prior = metricValue(previous, key, weightUnit);
                  const difference = current === null || prior === null ? null : current - prior;
                  const displayUnit = unit === "weight" ? (weightUnit === "KG" ? "kg" : "lb") : unit;
                  return (
                    <div className="rounded-lg bg-zinc-50 p-3" key={key}>
                      <dt className="text-sm text-zinc-600">{label}</dt>
                      <dd className="mt-1 font-medium">
                        {current === null ? "—" : `${current} ${displayUnit}`}
                        {difference !== null && (
                          <span className="ml-2 text-sm text-zinc-600">
                            ({difference > 0 ? "+" : ""}{Number(difference.toFixed(2))} {displayUnit})
                          </span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </section>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <form className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6" onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold">{editingId ? "Edit measurement" : "Record measurements"}</h2>
            <div>
              <label className="block text-sm font-medium" htmlFor="measurement-date">Date</label>
              <input className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" id="measurement-date" max={today} onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {metricFields.map(({ key, label, unit }) => {
                const displayUnit = unit === "weight" ? (weightUnit === "KG" ? "kg" : "lb") : unit;
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium" htmlFor={`measurement-${key}`}>{label} ({displayUnit})</label>
                    <input
                      className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
                      id={`measurement-${key}`}
                      max={key === "bodyFatPercent" ? 100 : key === "weightKg" ? 9999.99 : 999.99}
                      min={key === "bodyFatPercent" ? 0 : 0.01}
                      onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                      step="0.01"
                      type="number"
                      value={values[key]}
                    />
                  </div>
                );
              })}
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="measurement-notes">Notes (optional)</label>
              <textarea className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" id="measurement-notes" maxLength={1000} onChange={(event) => setNotes(event.target.value)} rows={2} value={notes} />
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={saving} type="submit">
                {saving ? "Saving..." : editingId ? "Save changes" : "Save measurements"}
              </button>
              {editingId && <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm" onClick={resetForm} type="button">Cancel edit</button>}
            </div>
          </form>

          <section aria-labelledby="measurement-history-heading" className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold" id="measurement-history-heading">Measurement history</h2>
            {loading ? <p className="mt-5 text-sm text-zinc-600" role="status">Loading measurements...</p> : items.length === 0 ? (
              <p className="mt-5 text-sm text-zinc-600">No measurements recorded yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-zinc-100">
                {items.map((item) => (
                  <li className="py-4 first:pt-0 last:pb-0" key={item.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <time className="font-medium text-zinc-950" dateTime={item.date}>{item.date.slice(0, 10)}</time>
                      <div className="flex gap-3">
                        <button className="text-sm underline underline-offset-4" onClick={() => editMeasurement(item)} type="button">Edit</button>
                        <button className="text-sm text-red-700 underline underline-offset-4" onClick={() => void handleDelete(item)} type="button">Delete</button>
                      </div>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                      {metricFields.flatMap(({ key, label, unit }) => {
                        const value = metricValue(item, key, weightUnit);
                        if (value === null) return [];
                        const displayUnit = unit === "weight" ? (weightUnit === "KG" ? "kg" : "lb") : unit;
                        return [<li key={key}>{label}: {value} {displayUnit}</li>];
                      })}
                    </ul>
                    {item.notes && <p className="mt-2 text-sm text-zinc-600">{item.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </main>
    </ProtectedAppShell>
  );
}
