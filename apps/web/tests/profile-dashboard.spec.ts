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

test("redirects signed-out visitors away from the dashboard", async ({ page }) => {
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

test("shows the dashboard account and future tracking placeholders", async ({
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
            { key: "workouts", available: false, plannedPhase: 4 },
            { key: "water", available: false, plannedPhase: 5 },
            { key: "measurements", available: false, plannedPhase: 5 },
            { key: "goals", available: false, plannedPhase: 6 },
          ],
        },
        meta: { timestamp: new Date().toISOString() },
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
  await expect(page.getByText("Available in Phase 4")).toBeVisible();
  await expect(page.getByText("Available in Phase 5")).toHaveCount(2);
  await expect(page.getByText("Available in Phase 6")).toBeVisible();
  await expect(
    page.getByText(
      "Your activity history will appear here once workout and health tracking are available.",
    ),
  ).toBeVisible();
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
