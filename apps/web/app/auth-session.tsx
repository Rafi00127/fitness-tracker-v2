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
  isLoading: boolean;
  setSession: (session: AuthSession) => void;
  signOut: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState("");
  const updateSession = useCallback((newSession: AuthSession) => {
    setSession(newSession);
    setInitializationError("");
    setIsLoading(false);
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
        if (isMounted) {
          if (!(cause instanceof AuthApiError && cause.status === 401)) {
            setInitializationError(
              cause instanceof Error
                ? cause.message
                : "Unable to restore your session.",
            );
          }
          setIsLoading(false);
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
    () => ({ session, isLoading, setSession: updateSession, signOut }),
    [session, isLoading, updateSession, signOut],
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
