"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AuthApiError,
  logout,
  refreshSession,
  type AuthenticatedUser,
} from "@/lib/auth-api";

export interface AuthSession {
  accessToken: string;
  user: AuthenticatedUser;
}

interface AuthSessionContextValue {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  signOut: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initializationError, setInitializationError] = useState("");
  const updateSession = useCallback((newSession: AuthSession) => {
    setSession(newSession);
    setInitializationError("");
  }, []);

  useEffect(() => {
    let isMounted = true;
    refreshSession()
      .then((restoredSession) => {
        if (isMounted) {
          updateSession(restoredSession);
        }
      })
      .catch((cause: unknown) => {
        if (
          isMounted &&
          !(cause instanceof AuthApiError && cause.status === 401)
        ) {
          setInitializationError(
            cause instanceof Error
              ? cause.message
              : "Unable to restore your session.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [updateSession]);

  const signOut = useCallback(async () => {
    await logout();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, setSession: updateSession, signOut }),
    [session, updateSession, signOut],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {initializationError && (
        <p className="px-6 py-3 text-center text-sm text-red-700" role="alert">
          {initializationError}
        </p>
      )}
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }

  return context;
}
