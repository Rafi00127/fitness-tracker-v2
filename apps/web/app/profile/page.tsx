"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  getProfile,
  updateProfile,
  type ProfileData,
  type WeightUnit,
} from "@/lib/fitness-api";
import { useAuthSession } from "../auth-session";
import { ProtectedAppShell } from "../protected-app-shell";

export default function ProfilePage() {
  const { session } = useAuthSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("KG");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isMounted = true;
    getProfile(session)
      .then((result) => {
        if (isMounted) {
          setProfile(result);
          setName(result.user.name ?? "");
          setHeightCm(result.profile.heightCm?.toString() ?? "");
          setWeightUnit(result.profile.weightUnit);
        }
      })
      .catch((cause: unknown) => {
        if (isMounted) {
          setError(
            cause instanceof Error ? cause.message : "Unable to load your profile.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setError("");
    setStatus("");
    setIsSaving(true);
    try {
      const updated = await updateProfile(session, {
        name: name.trim() || null,
        heightCm: heightCm === "" ? null : Number(heightCm),
        weightUnit,
      });
      setProfile(updated);
      setName(updated.user.name ?? "");
      setHeightCm(updated.profile.heightCm?.toString() ?? "");
      setStatus("Profile saved.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProtectedAppShell>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <Link
          className="text-sm font-medium text-zinc-600 underline underline-offset-4"
          href="/dashboard"
        >
          Back to dashboard
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">
          Your profile
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Update your display name and basic tracking preferences.
        </p>

        {error && (
          <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}

        {!profile && !error && (
          <p className="mt-8 text-sm text-zinc-600" role="status">
            Loading your profile...
          </p>
        )}

        {profile && (
          <form
            className="mt-8 space-y-5 rounded-xl border border-zinc-200 bg-white p-6"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="block text-sm font-medium text-zinc-900" htmlFor="email">
                Email
              </label>
              <input
                className="mt-2 block w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-zinc-600"
                id="email"
                readOnly
                value={profile.user.email}
              />
              <p className="mt-1 text-xs text-zinc-500">
                Email changes are not part of this phase.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900" htmlFor="name">
                Display name
              </label>
              <input
                autoComplete="name"
                className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-200"
                id="name"
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900" htmlFor="heightCm">
                Height (cm, optional)
              </label>
              <input
                className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-200"
                id="heightCm"
                max={300}
                min={30}
                onChange={(event) => setHeightCm(event.target.value)}
                step="0.1"
                type="number"
                value={heightCm}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900" htmlFor="weightUnit">
                Preferred weight unit
              </label>
              <select
                className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-200"
                id="weightUnit"
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "KG" || value === "LB") {
                    setWeightUnit(value);
                  }
                }}
                value={weightUnit}
              >
                <option value="KG">Kilograms (kg)</option>
                <option value="LB">Pounds (lb)</option>
              </select>
            </div>

            {status && (
              <p className="text-sm text-green-800" role="status">
                {status}
              </p>
            )}

            <button
              className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </form>
        )}
      </main>
    </ProtectedAppShell>
  );
}
