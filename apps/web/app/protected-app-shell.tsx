"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthSession } from "./auth-session";
import { SessionActions } from "./session-actions";

export function ProtectedAppShell({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuthSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [isLoading, router, session]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <p role="status">Loading your account...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <p role="status">Redirecting to sign in...</p>
      </main>
    );
  }

  return (
    <>
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link className="font-semibold text-zinc-950" href="/dashboard">
            Fitness Tracker
          </Link>
          <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-3">
            <Link
              className="text-sm text-zinc-700 hover:text-zinc-950"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="text-sm text-zinc-700 hover:text-zinc-950"
              href="/profile"
            >
              Profile
            </Link>
            <Link
              className="text-sm text-zinc-700 hover:text-zinc-950"
              href="/workouts"
            >
              Workouts
            </Link>
            <Link
              className="text-sm text-zinc-700 hover:text-zinc-950"
              href="/exercises"
            >
              Exercises
            </Link>
            <Link
              className="text-sm text-zinc-700 hover:text-zinc-950"
              href="/water"
            >
              Water
            </Link>
            <Link
              className="text-sm text-zinc-700 hover:text-zinc-950"
              href="/measurements"
            >
              Measurements
            </Link>
            <Link
              className="text-sm text-zinc-700 hover:text-zinc-950"
              href="/goals"
            >
              Goals
            </Link>
            <Link
              className="text-sm text-zinc-700 hover:text-zinc-950"
              href="/nutrition"
            >
              Nutrition
            </Link>
          </nav>
          <SessionActions />
        </div>
      </header>
      {children}
    </>
  );
}
