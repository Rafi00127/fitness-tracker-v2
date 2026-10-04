"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDashboardSummary, type DashboardSummary } from "@/lib/fitness-api";
import { useAuthSession } from "../auth-session";
import { ProtectedAppShell } from "../protected-app-shell";

const moduleNames: Record<DashboardSummary["trackingModules"][number]["key"], string> = {
  workouts: "Workouts",
  water: "Water",
  measurements: "Measurements",
  goals: "Goals",
};

export default function DashboardPage() {
  const { session } = useAuthSession();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

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
          <p className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-800" role="alert">
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
                  <h3 className="text-sm font-medium text-zinc-600">Profile setup</h3>
                  <p className="mt-2 text-xl font-semibold text-zinc-950">
                    {summary.profileComplete ? "Basics added" : "Needs a few details"}
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
                  <p className="mt-1 text-sm text-zinc-600">{summary.user.email}</p>
                </article>
              </div>
            </section>

            <section aria-labelledby="tracking-heading" className="mt-10">
              <h2 id="tracking-heading" className="text-xl font-semibold text-zinc-950">
                Tracking features
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                These summaries will appear as the tracking phases are implemented.
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
                      Available in Phase {item.plannedPhase}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="recent-heading" className="mt-10">
              <h2 id="recent-heading" className="text-xl font-semibold text-zinc-950">
                Recent activity
              </h2>
              <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white p-6">
                {summary.recentActivity.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    Your activity history will appear here once workout and health
                    tracking are available.
                  </p>
                ) : (
                  <ul aria-label="Recent activity">
                    {summary.recentActivity.map((activity, index) => (
                      <li key={index}>{JSON.stringify(activity)}</li>
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
