"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthApiError, register } from "@/lib/auth-api";
import { useAuthSession } from "../auth-session";

export default function RegisterPage() {
  const { setSession } = useAuthSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await register({
        email,
        password,
        ...(name.trim() ? { name: name.trim() } : {}),
      });
      setSession(session);
      setStatus(`Account created for ${session.user.email}.`);
    } catch (cause) {
      if (cause instanceof AuthApiError) {
        setError([cause.message, ...cause.details].join(" "));
      } else if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError("Unable to create your account. Please try again.");
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
      <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Use your email address to create a personal account.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium" htmlFor="name">
            Name <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <input
            autoComplete="name"
            className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-200"
            id="name"
            maxLength={100}
            name="name"
            onChange={(event) => setName(event.target.value)}
            type="text"
            value={name}
          />
        </div>

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
            autoComplete="new-password"
            className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-200"
            id="password"
            maxLength={72}
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Use at least 8 characters.
          </p>
        </div>

        <div>
          <label
            className="block text-sm font-medium"
            htmlFor="confirm-password"
          >
            Confirm password
          </label>
          <input
            autoComplete="new-password"
            className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-zinc-200"
            id="confirm-password"
            maxLength={72}
            minLength={8}
            name="confirmPassword"
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
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
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600">
        Already have an account?{" "}
        <Link
          className="font-medium text-zinc-950 underline underline-offset-4"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}
