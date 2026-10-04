import type { AuthSession } from "@/app/auth-session";

export type WeightUnit = "KG" | "LB";

export interface ProfileData {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  profile: {
    heightCm: number | null;
    weightUnit: WeightUnit;
  };
}

export interface DashboardSummary {
  user: {
    email: string;
    name: string | null;
    createdAt: string;
    profile: {
      heightCm: string | number | null;
      weightUnit: WeightUnit;
    } | null;
  };
  profileComplete: boolean;
  recentActivity: unknown[];
  trackingModules: Array<{
    key: "workouts" | "water" | "measurements" | "goals";
    available: boolean;
    plannedPhase: number;
  }>;
}

export async function getProfile(session: AuthSession): Promise<ProfileData> {
  const data = await requestData("/profiles/me", session.accessToken);
  if (!isProfileData(data)) {
    throw new Error("The profile service returned an invalid response.");
  }

  return data;
}

export async function updateProfile(
  session: AuthSession,
  input: {
    name?: string | null;
    heightCm?: number | null;
    weightUnit?: WeightUnit;
  },
): Promise<ProfileData> {
  const data = await requestData("/profiles/me", session.accessToken, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!isProfileData(data)) {
    throw new Error("The profile service returned an invalid response.");
  }

  return data;
}

export async function getDashboardSummary(
  session: AuthSession,
): Promise<DashboardSummary> {
  const data = await requestData("/dashboard/summary", session.accessToken);
  if (!isDashboardSummary(data)) {
    throw new Error("The dashboard service returned an invalid response.");
  }

  return data;
}

async function requestData(
  endpoint: string,
  accessToken: string,
  options: { method?: "GET" | "PATCH"; body?: string } = {},
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${endpoint}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.body && { "Content-Type": "application/json" }),
      },
      body: options.body,
    });
  } catch {
    throw new Error(
      "Cannot reach the fitness service. Check that the API and database are running.",
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The fitness service returned an invalid response.");
  }

  if (!response.ok) {
    const message =
      isRecord(payload) &&
      isRecord(payload.error) &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `The fitness service returned status ${response.status}.`;
    throw new Error(message);
  }

  if (!isRecord(payload) || !("data" in payload)) {
    throw new Error("The fitness service returned an invalid response.");
  }

  return payload.data;
}

function isWeightUnit(value: unknown): value is WeightUnit {
  return value === "KG" || value === "LB";
}

function isProfileData(value: unknown): value is ProfileData {
  return (
    isRecord(value) &&
    isRecord(value.user) &&
    typeof value.user.id === "string" &&
    typeof value.user.email === "string" &&
    (typeof value.user.name === "string" || value.user.name === null) &&
    typeof value.user.createdAt === "string" &&
    isRecord(value.profile) &&
    (typeof value.profile.heightCm === "number" ||
      value.profile.heightCm === null) &&
    isWeightUnit(value.profile.weightUnit)
  );
}

function isDashboardSummary(value: unknown): value is DashboardSummary {
  return (
    isRecord(value) &&
    isRecord(value.user) &&
    typeof value.user.email === "string" &&
    (typeof value.user.name === "string" || value.user.name === null) &&
    typeof value.user.createdAt === "string" &&
    (value.user.profile === null ||
      (isRecord(value.user.profile) &&
        (typeof value.user.profile.heightCm === "number" ||
          typeof value.user.profile.heightCm === "string" ||
          value.user.profile.heightCm === null) &&
        isWeightUnit(value.user.profile.weightUnit))) &&
    typeof value.profileComplete === "boolean" &&
    Array.isArray(value.recentActivity) &&
    Array.isArray(value.trackingModules) &&
    value.trackingModules.every(
      (module) =>
        isRecord(module) &&
        isTrackingModuleKey(module.key) &&
        typeof module.available === "boolean" &&
        typeof module.plannedPhase === "number",
    )
  );
}

function isTrackingModuleKey(
  value: unknown,
): value is DashboardSummary["trackingModules"][number]["key"] {
  return (
    value === "workouts" ||
    value === "water" ||
    value === "measurements" ||
    value === "goals"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
