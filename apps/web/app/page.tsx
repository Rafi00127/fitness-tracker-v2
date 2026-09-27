import Link from "next/link";
import { SessionActions } from "./session-actions";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Fitness Tracker
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
        Make room for progress.
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-600">
        Create an account or sign in to get started with your personal fitness
        tracker.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className="rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700"
          href="/register"
        >
          Create account
        </Link>
        <Link
          className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          href="/login"
        >
          Sign in
        </Link>
      </div>
      <SessionActions />
    </main>
  );
}
