"use client";

import { useState } from "react";
import { useAuthSession } from "./auth-session";

export function SessionActions() {
  const { session, signOut } = useAuthSession();
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!session) {
    return null;
  }

  async function handleSignOut() {
    setError("");
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign out.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="mt-8">
      <p className="text-sm text-zinc-600">
        Signed in as <span className="font-medium">{session.user.email}</span>
      </p>
      <button
        className="mt-3 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
