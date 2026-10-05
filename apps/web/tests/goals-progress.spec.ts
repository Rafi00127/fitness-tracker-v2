import { expect, test } from "@playwright/test";

const user = { id: "user-1", email: "member@example.com", name: "Member" };
const accessToken = "phase-six-access-token";
const timestamp = "2026-10-05T09:00:00.000Z";

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

test("creates, updates, and deletes an automatically tracked goal with charts", async ({
  page,
}) => {
  let goals: Array<Record<string, unknown>> = [];
  await page.route("**/api/v1/goals**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname.endsWith("/progress")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            water: [{ date: "2026-10-04", value: 1900 }],
            workouts: [{ date: "2026-10-03", value: 2 }],
            weight: [{ date: "2026-10-02", value: 75.5 }],
          },
          meta: { timestamp },
        }),
      });
      return;
    }

    if (method === "POST") {
      const input = request.postDataJSON();
      const goal = {
        id: "goal-1",
        ...input,
        targetDate: input.targetDate ?? null,
        startingWeightKg: null,
        currentValue: 1900,
        progressPercent: 95,
        status: "ACTIVE",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      goals = [goal];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: goal, meta: { timestamp } }),
      });
      return;
    }

    if (method === "PATCH") {
      const input = request.postDataJSON();
      goals = [{ ...goals[0], ...input }];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: goals[0], meta: { timestamp } }),
      });
      return;
    }

    if (method === "DELETE") {
      goals = [];
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
        data: goals,
        meta: {
          timestamp,
          pagination: {
            page: 1,
            limit: 100,
            total: goals.length,
            totalPages: goals.length ? 1 : 0,
          },
        },
      }),
    });
  });

  await page.goto("/goals");
  await page.getByLabel("Goal name").fill("Daily water");
  await page.getByLabel("Track").selectOption("DAILY_WATER_ML");
  await page.getByLabel("Target (ml/day)").fill("2000");
  await page.getByRole("button", { name: "Save goal" }).click();

  await expect(page.getByText("Goal saved.")).toBeVisible();
  await expect(page.getByText("Daily water intake · target 2,000 ml")).toBeVisible();
  await expect(page.getByText("Current: 1,900 ml")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Daily water intake chart" }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: "Daily water intake recorded values" }),
  ).toContainText("1900");

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Target (ml/day)").fill("2100");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Goal updated.")).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByText("No goals yet. Create one to see progress from your existing tracking records."),
  ).toBeVisible();
});
