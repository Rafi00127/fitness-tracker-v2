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
  recentActivity: Array<{
    id: string;
    title: string;
    date: string;
    durationMinutes: number | null;
    exercises: string[];
  }>;
  trackingModules: Array<{
    key:
      "workouts" | "water" | "measurements" | "goals" | "nutrition" | "plans";
    available: boolean;
    plannedPhase: number;
  }>;
}

export interface ExerciseRecord {
  id: string;
  name: string;
  category: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExerciseRecord {
  id: string;
  exerciseId: string;
  exercise: { id: string; name: string; category: string | null };
  sets: number | null;
  reps: number | null;
  weight: number | null;
  durationSeconds: number | null;
  notes: string | null;
}

export interface WorkoutRecord {
  id: string;
  title: string;
  date: string;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  exerciseEntries: WorkoutExerciseRecord[];
}

export interface WaterEntryRecord {
  id: string;
  date: string;
  amountMl: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementRecord {
  id: string;
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  hipCm: number | null;
  bicepsCm: number | null;
  bodyFatPercent: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GoalMetric =
  "DAILY_WATER_ML" | "WEEKLY_WORKOUTS" | "TARGET_WEIGHT_KG";

export interface GoalRecord {
  id: string;
  title: string;
  metric: GoalMetric;
  targetValue: number;
  targetDate: string | null;
  startingWeightKg: number | null;
  currentValue: number | null;
  progressPercent: number | null;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE";
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgress {
  water: Array<{ date: string; value: number }>;
  workouts: Array<{ date: string; value: number }>;
  weight: Array<{ date: string; value: number | null }>;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExerciseInput {
  name: string;
  category?: string | null;
  notes?: string | null;
}

export interface WorkoutExerciseInput {
  exerciseId: string;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  durationSeconds?: number | null;
  notes?: string | null;
}

export interface WorkoutInput {
  title: string;
  date: string;
  durationMinutes?: number | null;
  notes?: string | null;
  exerciseEntries?: WorkoutExerciseInput[];
}

export interface WaterInput {
  date: string;
  amountMl: number;
  notes?: string | null;
}

export interface MeasurementInput {
  date: string;
  weightKg?: number | null;
  waistCm?: number | null;
  chestCm?: number | null;
  hipCm?: number | null;
  bicepsCm?: number | null;
  bodyFatPercent?: number | null;
  notes?: string | null;
}

export interface GoalInput {
  title: string;
  metric: GoalMetric;
  targetValue: number;
  targetDate?: string | null;
}

export interface NutritionEntryRecord {
  id: string;
  date: string;
  description: string;
  caloriesKcal: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatsGrams: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionValueSummary {
  recordedEntryCount: number;
  total: number;
}

export interface NutritionSummary {
  entryCount: number;
  caloriesKcal: NutritionValueSummary;
  proteinGrams: NutritionValueSummary;
  carbsGrams: NutritionValueSummary;
  fatsGrams: NutritionValueSummary;
}

export interface NutritionInput {
  date: string;
  description: string;
  caloriesKcal?: number | null;
  proteinGrams?: number | null;
  carbsGrams?: number | null;
  fatsGrams?: number | null;
  notes?: string | null;
}

export interface PlanSummaryRecord {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanItemRecord {
  id: string;
  planId: string;
  title: string;
  scheduledDate: string;
  notes: string | null;
  workoutId: string | null;
  completed: boolean;
  completedAt: string | null;
  workout: {
    id: string;
    title: string;
    date: string;
    durationMinutes: number | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanRecord {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  items: PlanItemRecord[];
}

export interface PlanScheduleRecord extends PlanItemRecord {
  plan: { id: string; name: string };
}

export interface PlanInput {
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface PlanItemInput {
  title?: string;
  scheduledDate?: string;
  notes?: string | null;
  workoutId?: string | null;
  completed?: boolean;
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

export async function getExercises(
  session: AuthSession,
  options: { q?: string; page?: number; limit?: number } = {},
): Promise<PaginatedResult<ExerciseRecord>> {
  const query = new URLSearchParams();
  if (options.q) query.set("q", options.q);
  query.set("page", String(options.page ?? 1));
  query.set("limit", String(options.limit ?? 20));
  const response = await requestEnvelope(
    `/exercises?${query.toString()}`,
    session.accessToken,
  );
  if (
    !Array.isArray(response.data) ||
    !response.data.every(isExerciseRecord) ||
    !isPagination(response.meta.pagination)
  ) {
    throw new Error("The exercise service returned an invalid response.");
  }

  return { items: response.data, pagination: response.meta.pagination };
}

export async function createExercise(
  session: AuthSession,
  input: ExerciseInput,
): Promise<ExerciseRecord> {
  const data = await requestData("/exercises", session.accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!isExerciseRecord(data)) {
    throw new Error("The exercise service returned an invalid response.");
  }

  return data;
}

export async function updateExercise(
  session: AuthSession,
  exerciseId: string,
  input: Partial<ExerciseInput>,
): Promise<ExerciseRecord> {
  const data = await requestData(
    `/exercises/${encodeURIComponent(exerciseId)}`,
    session.accessToken,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  if (!isExerciseRecord(data)) {
    throw new Error("The exercise service returned an invalid response.");
  }

  return data;
}

export async function deleteExercise(
  session: AuthSession,
  exerciseId: string,
): Promise<void> {
  const data = await requestData(
    `/exercises/${encodeURIComponent(exerciseId)}`,
    session.accessToken,
    { method: "DELETE" },
  );
  if (!isRecord(data) || data.success !== true) {
    throw new Error("The exercise service returned an invalid response.");
  }
}

export async function getWorkouts(
  session: AuthSession,
  options: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<PaginatedResult<WorkoutRecord>> {
  const query = new URLSearchParams();
  if (options.from) query.set("from", options.from);
  if (options.to) query.set("to", options.to);
  query.set("page", String(options.page ?? 1));
  query.set("limit", String(options.limit ?? 20));
  const response = await requestEnvelope(
    `/workouts?${query.toString()}`,
    session.accessToken,
  );
  if (
    !Array.isArray(response.data) ||
    !response.data.every(isWorkoutRecord) ||
    !isPagination(response.meta.pagination)
  ) {
    throw new Error("The workout service returned an invalid response.");
  }

  return { items: response.data, pagination: response.meta.pagination };
}

export async function getWorkout(
  session: AuthSession,
  workoutId: string,
): Promise<WorkoutRecord> {
  const data = await requestData(
    `/workouts/${encodeURIComponent(workoutId)}`,
    session.accessToken,
  );
  if (!isWorkoutRecord(data)) {
    throw new Error("The workout service returned an invalid response.");
  }

  return data;
}

export async function createWorkout(
  session: AuthSession,
  input: WorkoutInput,
): Promise<WorkoutRecord> {
  const data = await requestData("/workouts", session.accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!isWorkoutRecord(data)) {
    throw new Error("The workout service returned an invalid response.");
  }

  return data;
}

export async function updateWorkout(
  session: AuthSession,
  workoutId: string,
  input: WorkoutInput,
): Promise<WorkoutRecord> {
  const data = await requestData(
    `/workouts/${encodeURIComponent(workoutId)}`,
    session.accessToken,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  if (!isWorkoutRecord(data)) {
    throw new Error("The workout service returned an invalid response.");
  }

  return data;
}

export async function deleteWorkout(
  session: AuthSession,
  workoutId: string,
): Promise<void> {
  const data = await requestData(
    `/workouts/${encodeURIComponent(workoutId)}`,
    session.accessToken,
    { method: "DELETE" },
  );
  if (!isRecord(data) || data.success !== true) {
    throw new Error("The workout service returned an invalid response.");
  }
}

export async function getWaterEntries(
  session: AuthSession,
  options: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<PaginatedResult<WaterEntryRecord> & { totalMl: number }> {
  const query = new URLSearchParams();
  if (options.from) query.set("from", options.from);
  if (options.to) query.set("to", options.to);
  query.set("page", String(options.page ?? 1));
  query.set("limit", String(options.limit ?? 20));
  const response = await requestEnvelope(
    `/water?${query.toString()}`,
    session.accessToken,
  );
  const totalMl = isRecord(response.meta.summary)
    ? response.meta.summary.totalMl
    : null;
  if (
    !Array.isArray(response.data) ||
    !response.data.every(isWaterEntryRecord) ||
    !isPagination(response.meta.pagination) ||
    typeof totalMl !== "number" ||
    !Number.isInteger(totalMl)
  ) {
    throw new Error("The water service returned an invalid response.");
  }

  return {
    items: response.data,
    pagination: response.meta.pagination,
    totalMl,
  };
}

export async function createWaterEntry(
  session: AuthSession,
  input: WaterInput,
): Promise<WaterEntryRecord> {
  const data = await requestData("/water", session.accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!isWaterEntryRecord(data)) {
    throw new Error("The water service returned an invalid response.");
  }
  return data;
}

export async function updateWaterEntry(
  session: AuthSession,
  entryId: string,
  input: Partial<WaterInput>,
): Promise<WaterEntryRecord> {
  const data = await requestData(
    `/water/${encodeURIComponent(entryId)}`,
    session.accessToken,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  if (!isWaterEntryRecord(data)) {
    throw new Error("The water service returned an invalid response.");
  }
  return data;
}

export async function deleteWaterEntry(
  session: AuthSession,
  entryId: string,
): Promise<void> {
  const data = await requestData(
    `/water/${encodeURIComponent(entryId)}`,
    session.accessToken,
    { method: "DELETE" },
  );
  if (!isRecord(data) || data.success !== true) {
    throw new Error("The water service returned an invalid response.");
  }
}

export async function getNutritionEntries(
  session: AuthSession,
  options: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<PaginatedResult<NutritionEntryRecord>> {
  const query = new URLSearchParams();
  if (options.from) query.set("from", options.from);
  if (options.to) query.set("to", options.to);
  query.set("page", String(options.page ?? 1));
  query.set("limit", String(options.limit ?? 20));
  const response = await requestEnvelope(
    `/nutrition?${query.toString()}`,
    session.accessToken,
  );
  if (
    !Array.isArray(response.data) ||
    !response.data.every(isNutritionEntryRecord) ||
    !isPagination(response.meta.pagination)
  ) {
    throw new Error("The nutrition service returned an invalid response.");
  }
  return { items: response.data, pagination: response.meta.pagination };
}

export async function getNutritionSummary(
  session: AuthSession,
  options: { from: string; to: string },
): Promise<NutritionSummary> {
  const query = new URLSearchParams(options);
  const data = await requestData(
    `/nutrition/summary?${query.toString()}`,
    session.accessToken,
  );
  if (!isNutritionSummary(data)) {
    throw new Error("The nutrition service returned an invalid summary.");
  }
  return data;
}

export async function createNutritionEntry(
  session: AuthSession,
  input: NutritionInput,
): Promise<NutritionEntryRecord> {
  const data = await requestData("/nutrition", session.accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!isNutritionEntryRecord(data)) {
    throw new Error("The nutrition service returned an invalid response.");
  }
  return data;
}

export async function updateNutritionEntry(
  session: AuthSession,
  entryId: string,
  input: Partial<NutritionInput>,
): Promise<NutritionEntryRecord> {
  const data = await requestData(
    `/nutrition/${encodeURIComponent(entryId)}`,
    session.accessToken,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  if (!isNutritionEntryRecord(data)) {
    throw new Error("The nutrition service returned an invalid response.");
  }
  return data;
}

export async function deleteNutritionEntry(
  session: AuthSession,
  entryId: string,
): Promise<void> {
  const data = await requestData(
    `/nutrition/${encodeURIComponent(entryId)}`,
    session.accessToken,
    { method: "DELETE" },
  );
  if (!isRecord(data) || data.success !== true) {
    throw new Error("The nutrition service returned an invalid response.");
  }
}

export async function getPlans(
  session: AuthSession,
  options: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<PlanSummaryRecord>> {
  const query = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
  });
  const response = await requestEnvelope(
    `/plans?${query.toString()}`,
    session.accessToken,
  );
  if (
    !Array.isArray(response.data) ||
    !response.data.every(isPlanSummaryRecord) ||
    !isPagination(response.meta.pagination)
  ) {
    throw new Error("The plans service returned an invalid response.");
  }
  return { items: response.data, pagination: response.meta.pagination };
}

export async function getPlan(
  session: AuthSession,
  planId: string,
): Promise<PlanRecord> {
  const data = await requestData(
    `/plans/${encodeURIComponent(planId)}`,
    session.accessToken,
  );
  if (!isPlanRecord(data)) {
    throw new Error("The plans service returned an invalid response.");
  }
  return data;
}

export async function createPlan(
  session: AuthSession,
  input: PlanInput,
): Promise<PlanRecord> {
  const data = await requestData("/plans", session.accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!isPlanRecord(data)) {
    throw new Error("The plans service returned an invalid response.");
  }
  return data;
}

export async function updatePlan(
  session: AuthSession,
  planId: string,
  input: Partial<PlanInput>,
): Promise<PlanRecord> {
  const data = await requestData(
    `/plans/${encodeURIComponent(planId)}`,
    session.accessToken,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  if (!isPlanRecord(data)) {
    throw new Error("The plans service returned an invalid response.");
  }
  return data;
}

export async function deletePlan(
  session: AuthSession,
  planId: string,
): Promise<void> {
  const data = await requestData(
    `/plans/${encodeURIComponent(planId)}`,
    session.accessToken,
    { method: "DELETE" },
  );
  if (!isRecord(data) || data.success !== true) {
    throw new Error("The plans service returned an invalid response.");
  }
}

export async function getPlanItems(
  session: AuthSession,
  planId: string,
  options: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<PlanItemRecord>> {
  const query = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
  });
  const response = await requestEnvelope(
    `/plans/${encodeURIComponent(planId)}/items?${query.toString()}`,
    session.accessToken,
  );
  if (
    !Array.isArray(response.data) ||
    !response.data.every(isPlanItemRecord) ||
    !isPagination(response.meta.pagination)
  ) {
    throw new Error("The plan schedule service returned an invalid response.");
  }
  return { items: response.data, pagination: response.meta.pagination };
}

export async function createPlanItem(
  session: AuthSession,
  planId: string,
  input: { title: string; scheduledDate: string; notes?: string | null },
): Promise<PlanItemRecord> {
  const data = await requestData(
    `/plans/${encodeURIComponent(planId)}/items`,
    session.accessToken,
    { method: "POST", body: JSON.stringify(input) },
  );
  if (!isPlanItemRecord(data)) {
    throw new Error("The plan schedule service returned an invalid response.");
  }
  return data;
}

export async function updatePlanItem(
  session: AuthSession,
  planId: string,
  itemId: string,
  input: PlanItemInput,
): Promise<PlanItemRecord> {
  const data = await requestData(
    `/plans/${encodeURIComponent(planId)}/items/${encodeURIComponent(itemId)}`,
    session.accessToken,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  if (!isPlanItemRecord(data)) {
    throw new Error("The plan schedule service returned an invalid response.");
  }
  return data;
}

export async function deletePlanItem(
  session: AuthSession,
  planId: string,
  itemId: string,
): Promise<void> {
  const data = await requestData(
    `/plans/${encodeURIComponent(planId)}/items/${encodeURIComponent(itemId)}`,
    session.accessToken,
    { method: "DELETE" },
  );
  if (!isRecord(data) || data.success !== true) {
    throw new Error("The plan schedule service returned an invalid response.");
  }
}

export async function getPlanSchedule(
  session: AuthSession,
  view: "upcoming" | "history",
  options: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<PlanScheduleRecord>> {
  const query = new URLSearchParams({
    view,
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
  });
  const response = await requestEnvelope(
    `/plans/schedule?${query.toString()}`,
    session.accessToken,
  );
  if (
    !Array.isArray(response.data) ||
    !response.data.every(isPlanScheduleRecord) ||
    !isPagination(response.meta.pagination)
  ) {
    throw new Error("The plan schedule service returned an invalid response.");
  }
  return { items: response.data, pagination: response.meta.pagination };
}

export async function getMeasurements(
  session: AuthSession,
  options: {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<PaginatedResult<MeasurementRecord>> {
  const query = new URLSearchParams();
  if (options.from) query.set("from", options.from);
  if (options.to) query.set("to", options.to);
  query.set("page", String(options.page ?? 1));
  query.set("limit", String(options.limit ?? 20));
  const response = await requestEnvelope(
    `/measurements?${query.toString()}`,
    session.accessToken,
  );
  if (
    !Array.isArray(response.data) ||
    !response.data.every(isMeasurementRecord) ||
    !isPagination(response.meta.pagination)
  ) {
    throw new Error("The measurements service returned an invalid response.");
  }
  return { items: response.data, pagination: response.meta.pagination };
}

export async function createMeasurement(
  session: AuthSession,
  input: MeasurementInput,
): Promise<MeasurementRecord> {
  const data = await requestData("/measurements", session.accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!isMeasurementRecord(data)) {
    throw new Error("The measurements service returned an invalid response.");
  }
  return data;
}

export async function updateMeasurement(
  session: AuthSession,
  measurementId: string,
  input: Partial<MeasurementInput>,
): Promise<MeasurementRecord> {
  const data = await requestData(
    `/measurements/${encodeURIComponent(measurementId)}`,
    session.accessToken,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  if (!isMeasurementRecord(data)) {
    throw new Error("The measurements service returned an invalid response.");
  }
  return data;
}

export async function deleteMeasurement(
  session: AuthSession,
  measurementId: string,
): Promise<void> {
  const data = await requestData(
    `/measurements/${encodeURIComponent(measurementId)}`,
    session.accessToken,
    { method: "DELETE" },
  );
  if (!isRecord(data) || data.success !== true) {
    throw new Error("The measurements service returned an invalid response.");
  }
}

export async function getGoals(
  session: AuthSession,
  options: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<GoalRecord>> {
  const query = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
  });
  const response = await requestEnvelope(
    `/goals?${query.toString()}`,
    session.accessToken,
  );
  if (
    !Array.isArray(response.data) ||
    !response.data.every(isGoalRecord) ||
    !isPagination(response.meta.pagination)
  ) {
    throw new Error("The goals service returned an invalid response.");
  }
  return { items: response.data, pagination: response.meta.pagination };
}

export async function createGoal(
  session: AuthSession,
  input: GoalInput,
): Promise<GoalRecord> {
  const data = await requestData("/goals", session.accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!isGoalRecord(data)) {
    throw new Error("The goals service returned an invalid response.");
  }
  return data;
}

export async function updateGoal(
  session: AuthSession,
  goalId: string,
  input: Partial<Pick<GoalInput, "title" | "targetValue" | "targetDate">>,
): Promise<GoalRecord> {
  const data = await requestData(
    `/goals/${encodeURIComponent(goalId)}`,
    session.accessToken,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  if (!isGoalRecord(data)) {
    throw new Error("The goals service returned an invalid response.");
  }
  return data;
}

export async function deleteGoal(
  session: AuthSession,
  goalId: string,
): Promise<void> {
  const data = await requestData(
    `/goals/${encodeURIComponent(goalId)}`,
    session.accessToken,
    { method: "DELETE" },
  );
  if (!isRecord(data) || data.success !== true) {
    throw new Error("The goals service returned an invalid response.");
  }
}

export async function getGoalProgress(
  session: AuthSession,
  options: { from: string; to: string },
): Promise<GoalProgress> {
  const query = new URLSearchParams(options);
  const data = await requestData(
    `/goals/progress?${query.toString()}`,
    session.accessToken,
  );
  if (
    !isRecord(data) ||
    !Array.isArray(data.water) ||
    !data.water.every(isChartPoint) ||
    !Array.isArray(data.workouts) ||
    !data.workouts.every(isChartPoint) ||
    !Array.isArray(data.weight) ||
    !data.weight.every(isWeightChartPoint)
  ) {
    throw new Error("The progress service returned an invalid response.");
  }
  return {
    water: data.water,
    workouts: data.workouts,
    weight: data.weight,
  };
}

async function requestData(
  endpoint: string,
  accessToken: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: string } = {},
): Promise<unknown> {
  return (await requestEnvelope(endpoint, accessToken, options)).data;
}

async function requestEnvelope(
  endpoint: string,
  accessToken: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: string } = {},
): Promise<{ data: unknown; meta: Record<string, unknown> }> {
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

  if (!isRecord(payload) || !("data" in payload) || !isRecord(payload.meta)) {
    throw new Error("The fitness service returned an invalid response.");
  }

  return { data: payload.data, meta: payload.meta };
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
    value.recentActivity.every(
      (activity) =>
        isRecord(activity) &&
        typeof activity.id === "string" &&
        typeof activity.title === "string" &&
        typeof activity.date === "string" &&
        (typeof activity.durationMinutes === "number" ||
          activity.durationMinutes === null) &&
        Array.isArray(activity.exercises) &&
        activity.exercises.every((exercise) => typeof exercise === "string"),
    ) &&
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
    value === "goals" ||
    value === "nutrition" ||
    value === "plans"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isExerciseRecord(value: unknown): value is ExerciseRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (typeof value.category === "string" || value.category === null) &&
    (typeof value.notes === "string" || value.notes === null) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isWorkoutExerciseRecord(
  value: unknown,
): value is WorkoutExerciseRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.exerciseId === "string" &&
    isRecord(value.exercise) &&
    typeof value.exercise.id === "string" &&
    typeof value.exercise.name === "string" &&
    (typeof value.exercise.category === "string" ||
      value.exercise.category === null) &&
    isNullableNumber(value.sets) &&
    isNullableNumber(value.reps) &&
    isNullableNumber(value.weight) &&
    isNullableNumber(value.durationSeconds) &&
    (typeof value.notes === "string" || value.notes === null)
  );
}

function isWorkoutRecord(value: unknown): value is WorkoutRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.date === "string" &&
    isNullableNumber(value.durationMinutes) &&
    (typeof value.notes === "string" || value.notes === null) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.exerciseEntries) &&
    value.exerciseEntries.every(isWorkoutExerciseRecord)
  );
}

function isWaterEntryRecord(value: unknown): value is WaterEntryRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    Number.isInteger(value.amountMl) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    (typeof value.notes === "string" || value.notes === null)
  );
}

function isNutritionEntryRecord(value: unknown): value is NutritionEntryRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.description === "string" &&
    isNullableNumber(value.caloriesKcal) &&
    isNullableNumber(value.proteinGrams) &&
    isNullableNumber(value.carbsGrams) &&
    isNullableNumber(value.fatsGrams) &&
    (typeof value.notes === "string" || value.notes === null) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isPlanSummaryRecord(value: unknown): value is PlanSummaryRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (typeof value.description === "string" || value.description === null) &&
    (typeof value.startDate === "string" || value.startDate === null) &&
    (typeof value.endDate === "string" || value.endDate === null) &&
    Number.isInteger(value.itemCount) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isPlanRecord(value: unknown): value is PlanRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (typeof value.description === "string" || value.description === null) &&
    (typeof value.startDate === "string" || value.startDate === null) &&
    (typeof value.endDate === "string" || value.endDate === null) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isPlanItemRecord)
  );
}

function isPlanItemRecord(value: unknown): value is PlanItemRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.planId === "string" &&
    typeof value.title === "string" &&
    typeof value.scheduledDate === "string" &&
    (typeof value.notes === "string" || value.notes === null) &&
    (typeof value.workoutId === "string" || value.workoutId === null) &&
    typeof value.completed === "boolean" &&
    (typeof value.completedAt === "string" || value.completedAt === null) &&
    (value.workout === null ||
      (isRecord(value.workout) &&
        typeof value.workout.id === "string" &&
        typeof value.workout.title === "string" &&
        typeof value.workout.date === "string" &&
        isNullableNumber(value.workout.durationMinutes))) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isPlanScheduleRecord(value: unknown): value is PlanScheduleRecord {
  if (!isRecord(value)) return false;
  const plan = value.plan;
  return (
    isPlanItemRecord(value) &&
    isRecord(plan) &&
    typeof plan.id === "string" &&
    typeof plan.name === "string"
  );
}

function isNutritionSummary(value: unknown): value is NutritionSummary {
  return (
    isRecord(value) &&
    Number.isInteger(value.entryCount) &&
    isNutritionValueSummary(value.caloriesKcal) &&
    isNutritionValueSummary(value.proteinGrams) &&
    isNutritionValueSummary(value.carbsGrams) &&
    isNutritionValueSummary(value.fatsGrams)
  );
}

function isNutritionValueSummary(
  value: unknown,
): value is NutritionValueSummary {
  return (
    isRecord(value) &&
    Number.isInteger(value.recordedEntryCount) &&
    typeof value.total === "number" &&
    Number.isFinite(value.total) &&
    value.total >= 0
  );
}

function isMeasurementRecord(value: unknown): value is MeasurementRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    [
      "weightKg",
      "waistCm",
      "chestCm",
      "hipCm",
      "bicepsCm",
      "bodyFatPercent",
    ].every((field) => isNullableNumber(value[field])) &&
    (typeof value.notes === "string" || value.notes === null) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isGoalRecord(value: unknown): value is GoalRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    isGoalMetric(value.metric) &&
    typeof value.targetValue === "number" &&
    (typeof value.targetDate === "string" || value.targetDate === null) &&
    isNullableNumber(value.startingWeightKg) &&
    isNullableNumber(value.currentValue) &&
    isNullableNumber(value.progressPercent) &&
    (value.status === "ACTIVE" ||
      value.status === "COMPLETED" ||
      value.status === "OVERDUE") &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isGoalMetric(value: unknown): value is GoalMetric {
  return (
    value === "DAILY_WATER_ML" ||
    value === "WEEKLY_WORKOUTS" ||
    value === "TARGET_WEIGHT_KG"
  );
}

function isChartPoint(
  value: unknown,
): value is { date: string; value: number } {
  return (
    isRecord(value) &&
    typeof value.date === "string" &&
    typeof value.value === "number" &&
    Number.isFinite(value.value)
  );
}

function isWeightChartPoint(
  value: unknown,
): value is { date: string; value: number | null } {
  return (
    isRecord(value) &&
    typeof value.date === "string" &&
    isNullableNumber(value.value)
  );
}

function isNullableNumber(value: unknown): value is number | null {
  return (
    value === null || (typeof value === "number" && Number.isFinite(value))
  );
}

function isPagination(
  value: unknown,
): value is PaginatedResult<unknown>["pagination"] {
  return (
    isRecord(value) &&
    Number.isInteger(value.page) &&
    Number.isInteger(value.limit) &&
    Number.isInteger(value.total) &&
    Number.isInteger(value.totalPages)
  );
}
