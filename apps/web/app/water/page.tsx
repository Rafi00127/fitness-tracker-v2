"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  createWaterEntry,
  deleteWaterEntry,
  getWaterEntries,
  updateWaterEntry,
  type WaterEntryRecord,
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

export default function WaterPage() {
  const { session } = useAuthSession();
  const today = localDateString(new Date());
  const [entries, setEntries] = useState<WaterEntryRecord[]>([]);
  const [totalMl, setTotalMl] = useState(0);
  const [from, setFrom] = useState(dateOffset(today, -6));
  const [to, setTo] = useState(today);
  const [activeRange, setActiveRange] = useState({ from: dateOffset(today, -6), to: today });
  const [date, setDate] = useState(today);
  const [amountMl, setAmountMl] = useState("");
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
    getWaterEntries(session, { ...activeRange, limit: 100 })
      .then((result) => {
        if (isMounted) {
          setEntries(result.items);
          setTotalMl(result.totalMl);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (isMounted) {
          setError(cause instanceof Error ? cause.message : "Unable to load water entries.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [session, activeRange, reloadKey]);

  function resetForm() {
    setEditingId(null);
    setDate(today);
    setAmountMl("");
    setNotes("");
  }

  function editEntry(entry: WaterEntryRecord) {
    setEditingId(entry.id);
    setDate(entry.date.slice(0, 10));
    setAmountMl(String(entry.amountMl));
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
      const input = { date, amountMl: Number(amountMl), notes: notes.trim() || null };
      if (editingId) {
        await updateWaterEntry(session, editingId, input);
        setStatus("Water entry updated.");
      } else {
        await createWaterEntry(session, input);
        setStatus("Daily water intake saved.");
      }
      resetForm();
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save water intake.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry: WaterEntryRecord) {
    if (!session || !window.confirm(`Delete the water entry for ${entry.date.slice(0, 10)}?`)) return;
    setError("");
    try {
      await deleteWaterEntry(session, entry.id);
      if (editingId === entry.id) resetForm();
      setStatus("Water entry deleted.");
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete water entry.");
    }
  }

  return (
    <ProtectedAppShell>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <Link className="text-sm font-medium text-zinc-600 underline underline-offset-4" href="/dashboard">
          Back to dashboard
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">Water intake</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Record one daily total in milliliters. You can revise or remove a day&apos;s entry.
        </p>
        {error && <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {status && <p className="mt-6 rounded-md bg-green-50 p-4 text-sm text-green-800" role="status">{status}</p>}

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <form className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6" onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold">{editingId ? "Edit daily intake" : "Log daily intake"}</h2>
            <div>
              <label className="block text-sm font-medium" htmlFor="water-date">Date</label>
              <input className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" id="water-date" max={today} onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="water-amount">Total intake (ml)</label>
              <input className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" id="water-amount" max={100000} min={1} onChange={(event) => setAmountMl(event.target.value)} required type="number" value={amountMl} />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="water-notes">Notes (optional)</label>
              <textarea className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2" id="water-notes" maxLength={1000} onChange={(event) => setNotes(event.target.value)} rows={2} value={notes} />
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={saving} type="submit">
                {saving ? "Saving..." : editingId ? "Save changes" : "Save daily intake"}
              </button>
              {editingId && <button className="rounded-md border border-zinc-300 px-4 py-2 text-sm" onClick={resetForm} type="button">Cancel edit</button>}
            </div>
          </form>

          <section aria-labelledby="water-history-heading" className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold" id="water-history-heading">Daily history</h2>
            <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(event) => {
              event.preventDefault();
              if (from > to) {
                setError("Start date must be on or before end date.");
                return;
              }
              setError("");
              setActiveRange({ from, to });
            }}>
              <div>
                <label className="block text-xs font-medium" htmlFor="water-from">From</label>
                <input className="mt-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm" id="water-from" onChange={(event) => setFrom(event.target.value)} type="date" value={from} />
              </div>
              <div>
                <label className="block text-xs font-medium" htmlFor="water-to">To</label>
                <input className="mt-1 rounded-md border border-zinc-300 px-2 py-1.5 text-sm" id="water-to" onChange={(event) => setTo(event.target.value)} type="date" value={to} />
              </div>
              <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm" type="submit">Apply</button>
            </form>
            <p className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-950">
              Total for selected dates: <strong>{totalMl.toLocaleString()} ml</strong>
            </p>
            {loading ? <p className="mt-5 text-sm text-zinc-600" role="status">Loading water history...</p> : entries.length === 0 ? (
              <p className="mt-5 text-sm text-zinc-600">No water entries for this date range.</p>
            ) : (
              <ul className="mt-5 divide-y divide-zinc-100">
                {entries.map((entry) => (
                  <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0" key={entry.id}>
                    <div>
                      <time className="font-medium text-zinc-950" dateTime={entry.date}>{entry.date.slice(0, 10)}</time>
                      <p className="text-sm text-zinc-600">{entry.amountMl.toLocaleString()} ml{entry.notes ? ` · ${entry.notes}` : ""}</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="text-sm underline underline-offset-4" onClick={() => editEntry(entry)} type="button">Edit</button>
                      <button className="text-sm text-red-700 underline underline-offset-4" onClick={() => void handleDelete(entry)} type="button">Delete</button>
                    </div>
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
