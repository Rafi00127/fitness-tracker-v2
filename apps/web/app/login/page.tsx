"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthApiError, login } from "@/lib/auth-api";
import { useAuthSession } from "../auth-session";

export default function LoginPage() {
  const { setSession } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setIsSubmitting(true);

    try {
      const session = await login({ email, password });
      setSession(session);
      setStatus(`Signed in as ${session.user.email}.`);
    } catch (cause) {
      if (cause instanceof AuthApiError) {
        setError([cause.message, ...cause.details].join(" "));
      } else if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <Link
        className="mb-8 text-sm font-medium text-zinc-600 hover:text-zinc-950"
        href="/"
      >
        Fitness Tracker
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Sign in to continue to your account.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            autoComplete="email"
            className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-200"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            autoComplete="current-password"
            className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-200"
            id="password"
            maxLength={72}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {status && (
          <p className="text-sm text-green-800" role="status">
            {status}
          </p>
        )}

        <button
          className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link
          className="font-medium text-zinc-950 underline underline-offset-4"
          href="/register"
        >
          Create one
        </Link>
      </p>
    </main>
  );
}
