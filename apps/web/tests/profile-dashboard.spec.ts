import { expect, test } from "@playwright/test";

const signedInUser = {
  id: "user-1",
  email: "member@example.com",
  name: "Member",
};
const accessToken = "phase-three-access-token";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { user: signedInUser, accessToken },
        meta: { timestamp: new Date().toISOString() },
      }),
    });
  });
});

test("redirects signed-out visitors away from the dashboard", async ({
  page,
}) => {
  await page.unroute("**/api/v1/auth/refresh");
  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid refresh token",
          details: [],
        },
      }),
    });
  });

  await page.goto("/dashboard");
  await page.waitForURL("**/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("shows available tracking modules and an empty goal overview", async ({
  page,
}) => {
  await page.route("**/api/v1/dashboard/summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            email: signedInUser.email,
            name: signedInUser.name,
            createdAt: new Date().toISOString(),
            profile: { heightCm: null, weightUnit: "KG" },
          },
          profileComplete: false,
          recentActivity: [],
          trackingModules: [
            { key: "workouts", available: true, plannedPhase: 4 },
            { key: "water", available: true, plannedPhase: 5 },
            { key: "measurements", available: true, plannedPhase: 5 },
            { key: "goals", available: true, plannedPhase: 6 },
            { key: "nutrition", available: true, plannedPhase: 7 },
            { key: "plans", available: true, plannedPhase: 8 },
          ],
        },
        meta: { timestamp: new Date().toISOString() },
      }),
    });
  });
  await page.route("**/api/v1/goals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        meta: {
          timestamp: new Date().toISOString(),
          pagination: { page: 1, limit: 3, total: 0, totalPages: 0 },
        },
      }),
    });
  });

  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText("member@example.com"),
  ).toBeVisible();
  await expect(page.getByText("Available now")).toHaveCount(6);
  await expect(page.getByText("Available in Phase 5")).toHaveCount(0);
  await expect(page.getByText("Available in Phase 6")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "View water log" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View measurements" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "View goals" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View nutrition log" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View plans and schedule" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Create a goal to see automatically calculated progress here.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Your workout history will appear here after you log a workout.",
    ),
  ).toBeVisible();
});

test("shows automatically calculated goal progress on the dashboard", async ({
  page,
}) => {
  await page.route("**/api/v1/dashboard/summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            email: signedInUser.email,
            name: signedInUser.name,
            createdAt: new Date().toISOString(),
            profile: { heightCm: null, weightUnit: "KG" },
          },
          profileComplete: false,
          recentActivity: [],
          trackingModules: [
            { key: "workouts", available: true, plannedPhase: 4 },
            { key: "water", available: true, plannedPhase: 5 },
            { key: "measurements", available: true, plannedPhase: 5 },
            { key: "goals", available: true, plannedPhase: 6 },
            { key: "nutrition", available: true, plannedPhase: 7 },
            { key: "plans", available: true, plannedPhase: 8 },
          ],
        },
        meta: { timestamp: new Date().toISOString() },
      }),
    });
  });
  await page.route("**/api/v1/goals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "goal-1",
            title: "Daily water",
            metric: "DAILY_WATER_ML",
            targetValue: 2000,
            targetDate: null,
            startingWeightKg: null,
            currentValue: 1500,
            progressPercent: 75,
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        meta: {
          timestamp: new Date().toISOString(),
          pagination: { page: 1, limit: 3, total: 1, totalPages: 1 },
        },
      }),
    });
  });

  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: "Goal progress" }),
  ).toBeVisible();
  await expect(page.getByText("1,500 of 2,000 · active")).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Daily water progress" }),
  ).toHaveAttribute("value", "75");
});

test("loads and saves profile details", async ({ page }) => {
  let savedProfile: {
    name: string | null;
    heightCm: number | null;
    weightUnit: "KG" | "LB";
  } = { name: "Member", heightCm: null, weightUnit: "KG" };

  await page.route("**/api/v1/profiles/me", async (route) => {
    if (route.request().method() === "PATCH") {
      savedProfile = route.request().postDataJSON();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            ...signedInUser,
            name: savedProfile.name,
            createdAt: new Date().toISOString(),
          },
          profile: {
            heightCm: savedProfile.heightCm,
            weightUnit: savedProfile.weightUnit,
          },
        },
        meta: { timestamp: new Date().toISOString() },
      }),
    });
  });

  await page.goto("/profile");
  await page.getByLabel("Display name").fill("  ");
  await page.getByLabel("Height (cm, optional)").fill("172");
  await page.getByLabel("Preferred weight unit").selectOption("LB");
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(page.getByRole("status")).toHaveText("Profile saved.");
  expect(savedProfile).toEqual({
    name: null,
    heightCm: 172,
    weightUnit: "LB",
  });
  await expect(page.getByLabel("Email")).toHaveValue(signedInUser.email);
  await expect(page.getByLabel("Email")).toHaveAttribute("readonly", "");
});
