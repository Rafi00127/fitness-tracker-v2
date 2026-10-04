export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthenticatedSession {
  user: AuthenticatedUser;
  accessToken: string;
}

interface ApiErrorPayload {
  error?: {
    message?: unknown;
    details?: unknown;
  };
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly details: string[] = [],
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

export function register(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthenticatedSession> {
  return postAuth("register", input);
}

export function login(input: {
  email: string;
  password: string;
}): Promise<AuthenticatedSession> {
  return postAuth("login", input);
}

export function refreshSession(): Promise<AuthenticatedSession> {
  return postAuth("refresh");
}

export async function logout(): Promise<void> {
  const payload = await requestAuth("logout");
  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    payload.data.success !== true
  ) {
    throw new Error("The authentication service returned an invalid response.");
  }
}

async function postAuth(
  endpoint: "register" | "login" | "refresh",
  input?: { email: string; password: string; name?: string },
): Promise<AuthenticatedSession> {
  return parseAuthenticatedSession(await requestAuth(endpoint, input));
}

async function requestAuth(
  endpoint: "register" | "login" | "refresh" | "logout",
  input?: { email: string; password: string; name?: string },
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`/api/v1/auth/${endpoint}`, {
      method: "POST",
      credentials: "include",
      ...(input
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        : {}),
    });
  } catch {
    throw new Error(
      "Cannot reach the authentication service. Start the API and database, then try again.",
    );
  }

  if (!response.headers.get("content-type")?.includes("application/json")) {
    if (response.status >= 500) {
      throw new Error(
        "The authentication service is unavailable. Start the API and database, then try again.",
      );
    }

    throw new Error("The authentication service returned an invalid response.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The authentication service returned an invalid response.");
  }

  if (!response.ok) {
    throw toAuthApiError(payload, response.status);
  }

  return payload;
}

function parseAuthenticatedSession(payload: unknown): AuthenticatedSession {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error("The authentication service returned an invalid response.");
  }

  const { user, accessToken } = payload.data;
  if (
    !isRecord(user) ||
    typeof user.id !== "string" ||
    typeof user.email !== "string" ||
    !(typeof user.name === "string" || user.name === null) ||
    typeof accessToken !== "string"
  ) {
    throw new Error("The authentication service returned an invalid response.");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    accessToken,
  };
}

function toAuthApiError(payload: unknown, status: number): AuthApiError {
  const error =
    isRecord(payload) && isRecord(payload.error)
      ? (payload.error as ApiErrorPayload["error"])
      : undefined;
  const message =
    error && typeof error.message === "string"
      ? error.message
      : `Authentication failed with status ${status}.`;
  const details =
    error && Array.isArray(error.details)
      ? error.details.filter(
          (detail): detail is string => typeof detail === "string",
        )
      : [];

  return new AuthApiError(message, details, status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
