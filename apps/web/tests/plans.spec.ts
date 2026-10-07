import { expect, test } from "@playwright/test";

const user = { id: "user-1", email: "member@example.com", name: "Member" };
const accessToken = "phase-eight-access-token";
const timestamp = "2026-10-07T09:00:00.000Z";

function calendarDate(offsetDays: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

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

test("creates a plan, schedules and completes a session, links a workout, and reviews history", async ({
  page,
}) => {
  const futureDate = calendarDate(1);
  const pastDate = calendarDate(-1);
  const plan = {
    id: "plan-1",
    name: "Four-week strength",
    description: "Build a steady routine",
    startDate: null,
    endDate: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    items: [] as Array<Record<string, unknown>>,
  };
  let item: Record<string, unknown> | null = null;
  let planCreated = false;
  const workout = {
    id: "workout-1",
    title: "Logged strength workout",
    date: `${futureDate}T10:00:00.000Z`,
    durationMinutes: 45,
    notes: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    exerciseEntries: [],
  };

  await page.route("**/api/v1/plans**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === "/api/v1/plans/schedule") {
      const upcoming = url.searchParams.get("view") === "upcoming";
      const scheduleItems = upcoming
        ? item
          ? [{ ...item, plan: { id: plan.id, name: plan.name } }]
          : []
        : [
            {
              id: "past-item",
              planId: plan.id,
              title: "Yesterday's run",
              scheduledDate: `${pastDate}T00:00:00.000Z`,
              notes: null,
              workoutId: null,
              completed: false,
              completedAt: null,
              workout: null,
              createdAt: timestamp,
              updatedAt: timestamp,
              plan: { id: plan.id, name: plan.name },
            },
          ];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: scheduleItems,
          meta: {
            timestamp,
            pagination: {
              page: 1,
              limit: 20,
              total: scheduleItems.length,
              totalPages: scheduleItems.length ? 1 : 0,
            },
          },
        }),
      });
      return;
    }

    if (path === "/api/v1/plans" && method === "POST") {
      const input = request.postDataJSON();
      Object.assign(plan, input);
      planCreated = true;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: plan, meta: { timestamp } }),
      });
      return;
    }

    if (path === "/api/v1/plans" && method === "GET") {
      const plans = planCreated ? [{ ...plan, itemCount: item ? 1 : 0 }] : [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: plans,
          meta: {
            timestamp,
            pagination: {
              page: 1,
              limit: 20,
              total: plans.length,
              totalPages: plans.length ? 1 : 0,
            },
          },
        }),
      });
      return;
    }

    if (path === `/api/v1/plans/${plan.id}/items` && method === "POST") {
      const input = request.postDataJSON();
      const createdItem = {
        id: "item-1",
        planId: plan.id,
        ...input,
        workoutId: null,
        completed: false,
        completedAt: null,
        workout: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      item = createdItem;
      plan.items = [createdItem];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: item, meta: { timestamp } }),
      });
      return;
    }

    if (
      path === `/api/v1/plans/${plan.id}/items/item-1` &&
      method === "PATCH" &&
      item
    ) {
      const input = request.postDataJSON();
      const linkedWorkout = input.workoutId
        ? {
            id: workout.id,
            title: workout.title,
            date: workout.date,
            durationMinutes: workout.durationMinutes,
          }
        : null;
      const updatedItem = {
        ...item,
        ...input,
        workoutId: input.workoutId ?? null,
        completed:
          input.completed === false
            ? false
            : input.completed === true ||
              Boolean(input.workoutId) ||
              item.completed,
        completedAt:
          input.completed === false
            ? null
            : (item.completedAt ??
              (input.completed === true || input.workoutId ? timestamp : null)),
        workout: linkedWorkout,
        updatedAt: timestamp,
      };
      item = updatedItem;
      plan.items = [updatedItem];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: item, meta: { timestamp } }),
      });
      return;
    }

    if (path === `/api/v1/plans/${plan.id}` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: plan, meta: { timestamp } }),
      });
      return;
    }

    await route.fulfill({ status: 404, body: "Unexpected plan request" });
  });

  await page.route("**/api/v1/workouts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [workout],
        meta: {
          timestamp,
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        },
      }),
    });
  });

  await page.goto("/plans");
  await expect(
    page.getByText("No plans yet. Create one to start scheduling sessions."),
  ).toBeVisible();
  await page.getByLabel("Plan name").fill("Four-week strength");
  await page
    .getByLabel("Description (optional)")
    .fill("Build a steady routine");
  await page.getByRole("button", { name: "Create plan" }).click();
  await expect(page.getByText("Training plan created.")).toBeVisible();
  await page.getByRole("link", { name: /Four-week strength/ }).click();

  await page.getByLabel("Session title").fill("Strength day");
  await page.getByLabel("Scheduled date").fill(futureDate);
  await page.getByRole("button", { name: "Add scheduled session" }).click();
  await expect(page.getByText("Scheduled session added.")).toBeVisible();
  await page.getByRole("button", { name: "Edit session" }).click();
  await page.getByLabel("Session title").last().fill("Strength day");
  await page.getByLabel("Notes (optional)").last().fill("Targeted work");
  await page.getByRole("button", { name: "Save session changes" }).click();
  await expect(page.getByText("Scheduled session updated.")).toBeVisible();
  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByText("Session marked complete.")).toBeVisible();
  await expect(
    page
      .locator("li")
      .filter({ hasText: "Strength day" })
      .getByText("Completed"),
  ).toBeVisible();

  await page.getByLabel("Link a logged workout").selectOption("workout-1");
  await page.getByRole("button", { name: "Save workout link" }).click();
  await expect(page.getByText("Workout linked.")).toBeVisible();
  await expect(
    page.getByText("Linked workout: Logged strength workout"),
  ).toBeVisible();

  await page.getByRole("link", { name: "Back to plans and schedule" }).click();
  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByText("Yesterday's run")).toBeVisible();
});

test("shows plan service failures", async ({ page }) => {
  await page.route("**/api/v1/plans**", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "SERVICE_UNAVAILABLE", message: "Plans are offline." },
      }),
    });
  });
  await page.goto("/plans");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Plans are offline.",
  );
});
