import { expect, test } from "@playwright/test";

const user = {
  id: "user-1",
  email: "member@example.com",
  name: "Member",
};
const accessToken = "phase-four-access-token";
const timestamp = "2026-10-05T09:00:00.000Z";
const exercise = {
  id: "exercise-1",
  name: "Squat",
  category: "Strength",
  notes: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};
const workout = {
  id: "workout-1",
  title: "Leg day",
  date: timestamp,
  durationMinutes: 45,
  notes: "Steady session",
  createdAt: timestamp,
  updatedAt: timestamp,
  exerciseEntries: [
    {
      id: "entry-1",
      exerciseId: exercise.id,
      exercise: {
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
      },
      sets: 3,
      reps: 8,
      weight: 50.5,
      durationSeconds: null,
      notes: null,
    },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { user, accessToken },
        meta: { timestamp },
      }),
    });
  });
});

test("creates an exercise in the private catalog", async ({ page }) => {
  const exercises = [exercise];
  await page.route("**/api/v1/exercises**", async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      const input = route.request().postDataJSON();
      const createdExercise = {
        ...exercise,
        id: "exercise-2",
        name: input.name,
        category: input.category,
      };
      exercises.push(createdExercise);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: createdExercise,
          meta: { timestamp },
        }),
      });
      return;
    }
    if (method === "PATCH") {
      const input = route.request().postDataJSON();
      const updatedExercise = { ...exercises[1], ...input };
      exercises[1] = updatedExercise;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: updatedExercise,
          meta: { timestamp },
        }),
      });
      return;
    }
    if (method === "DELETE") {
      exercises.splice(1, 1);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { success: true },
          meta: { timestamp },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: exercises,
        meta: {
          timestamp,
          pagination: {
            page: 1,
            limit: 20,
            total: exercises.length,
            totalPages: 1,
          },
        },
      }),
    });
  });

  await page.goto("/exercises");
  await page.getByLabel("Name", { exact: true }).fill("Deadlift");
  await page.getByLabel("Category (optional)").fill("Strength");
  await page.getByRole("button", { name: "Add exercise" }).click();

  await expect(
    page.getByText("Exercise created.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deadlift" })).toBeVisible();

  await page.getByRole("button", { name: "Edit Deadlift" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Romanian deadlift");
  await page.getByRole("button", { name: "Save exercise" }).click();
  await expect(
    page.getByText("Exercise updated.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Romanian deadlift" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Delete Romanian deadlift" }).click();
  await page
    .getByRole("button", { name: "Confirm delete Romanian deadlift" })
    .click();
  await expect(
    page.getByText("Exercise deleted.", { exact: true }),
  ).toBeVisible();
});

test("creates a workout with exercise details and opens its detail page", async ({
  page,
}) => {
  let submitted: Record<string, unknown> | null = null;
  await page.route("**/api/v1/exercises**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [exercise],
        meta: {
          timestamp,
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        },
      }),
    });
  });
  await page.route("**/api/v1/profiles/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: { ...user, createdAt: timestamp },
          profile: { heightCm: null, weightUnit: "KG" },
        },
        meta: { timestamp },
      }),
    });
  });
  await page.route("**/api/v1/workouts**", async (route) => {
    if (route.request().method() === "POST") {
      submitted = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: workout, meta: { timestamp } }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: workout, meta: { timestamp } }),
    });
  });

  await page.goto("/workouts/new");
  await page.getByLabel("Workout title").fill("Leg day");
  await page.getByLabel("Duration (minutes, optional)").fill("45");
  await page.getByRole("button", { name: "Add exercise" }).click();
  await page.getByLabel("Sets").fill("3");
  await page.getByLabel("Reps").fill("8");
  await page.getByLabel("Weight (KG)").fill("50.5");
  const createResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/api/v1/workouts"),
  );
  await page.getByRole("button", { name: "Create workout" }).click();
  expect((await createResponse).ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/workouts\/workout-1$/, { timeout: 10_000 });
  await expect(
    page.getByRole("heading", { name: "Edit workout" }),
  ).toBeVisible();
  await expect(page.getByLabel("Workout title")).toHaveValue("Leg day");
  expect(submitted).toMatchObject({
    title: "Leg day",
    durationMinutes: 45,
    exerciseEntries: [
      {
        exerciseId: "exercise-1",
        sets: 3,
        reps: 8,
        weight: 50.5,
      },
    ],
  });
});

test("loads workout history and opens the selected workout", async ({
  page,
}) => {
  await page.route("**/api/v1/workouts**", async (route) => {
    const method = route.request().method();
    if (method === "PATCH") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: workout,
          meta: { timestamp },
        }),
      });
      return;
    }
    if (method === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { success: true },
          meta: { timestamp },
        }),
      });
      return;
    }

    const body = route.request().url().endsWith("/workouts/workout-1")
      ? { data: workout, meta: { timestamp } }
      : {
          data: [workout],
          meta: {
            timestamp,
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          },
        };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  await page.route("**/api/v1/exercises**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [exercise],
        meta: {
          timestamp,
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        },
      }),
    });
  });
  await page.route("**/api/v1/profiles/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: { ...user, createdAt: timestamp },
          profile: { heightCm: null, weightUnit: "KG" },
        },
        meta: { timestamp },
      }),
    });
  });

  await page.goto("/workouts");
  await page.getByRole("link", { name: /Leg day/ }).click();

  await expect(page).toHaveURL(/\/workouts\/workout-1$/);
  await expect(page.getByLabel("Workout title")).toHaveValue("Leg day");
  await expect(page.getByLabel("Exercise", { exact: true })).toHaveValue(
    "exercise-1",
  );
  await page.getByLabel("Workout title").fill("Updated leg day");
  await page.getByRole("button", { name: "Save workout" }).click();
  await expect(page.getByText("Workout saved.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete workout" }).click();
  await page.getByRole("button", { name: "Confirm delete workout" }).click();
  await expect(page).toHaveURL(/\/workouts$/);
});
