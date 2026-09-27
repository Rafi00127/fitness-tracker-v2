import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
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
});

test("signs in and keeps the access token out of persistent browser storage", async ({
  page,
}) => {
  let loginRequestBody: unknown;
  await page.route("**/api/v1/auth/login", async (route) => {
    loginRequestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            id: "user-1",
            email: "member@example.com",
            name: "Member",
          },
          accessToken: "test-access-token",
        },
        meta: { timestamp: new Date().toISOString() },
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("member@example.com");
  await page.getByLabel("Password").fill("valid-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("status")).toHaveText(
    "Signed in as member@example.com.",
  );
  expect(loginRequestBody).toEqual({
    email: "member@example.com",
    password: "valid-password",
  });
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("validates registration confirmation before making an API request", async ({
  page,
}) => {
  let registrationRequested = false;
  await page.route("**/api/v1/auth/register", async (route) => {
    registrationRequested = true;
    await route.fulfill({ status: 201, body: "{}" });
  });

  await page.goto("/register");
  await page.getByLabel("Email").fill("member@example.com");
  await page.getByLabel("Password", { exact: true }).fill("valid-password");
  await page.getByLabel("Confirm password").fill("different-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText("Passwords do not match.", { exact: true }),
  ).toBeVisible();
  expect(registrationRequested).toBe(false);
});

test("registers a user and establishes an in-memory session", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/register", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            id: "user-1",
            email: "member@example.com",
            name: null,
          },
          accessToken: "test-access-token",
        },
        meta: { timestamp: new Date().toISOString() },
      }),
    });
  });

  await page.goto("/register");
  await page.getByLabel("Email").fill("member@example.com");
  await page.getByLabel("Password", { exact: true }).fill("valid-password");
  await page.getByLabel("Confirm password").fill("valid-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("status")).toHaveText(
    "Account created for member@example.com.",
  );
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("reports duplicate email errors", async ({ page }) => {
  await page.route("**/api/v1/auth/register", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "CONFLICT",
          message: "Email already registered",
          details: [],
        },
      }),
    });
  });

  await page.goto("/register");
  await page.getByLabel("Email").fill("member@example.com");
  await page.getByLabel("Password", { exact: true }).fill("valid-password");
  await page.getByLabel("Confirm password").fill("valid-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText("Email already registered", { exact: true }),
  ).toBeVisible();
});

test("restores a session from the refresh cookie and signs out", async ({
  page,
}) => {
  await page.unroute("**/api/v1/auth/refresh");
  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          user: {
            id: "user-1",
            email: "member@example.com",
            name: "Member",
          },
          accessToken: "restored-access-token",
        },
        meta: { timestamp: new Date().toISOString() },
      }),
    });
  });
  await page.route("**/api/v1/auth/logout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { success: true },
        meta: { timestamp: new Date().toISOString() },
      }),
    });
  });

  await page.goto("/");
  await expect(page.getByText("Signed in as")).toContainText(
    "member@example.com",
  );
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByText("Signed in as")).toHaveCount(0);
});
