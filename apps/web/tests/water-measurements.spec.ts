import { expect, test } from "@playwright/test";

const user = {
  id: "user-1",
  email: "member@example.com",
  name: "Member",
};
const accessToken = "phase-five-access-token";
const timestamp = "2026-10-05T09:00:00.000Z";
const profile = {
  user: { ...user, createdAt: timestamp },
  profile: { heightCm: null, weightUnit: "LB" },
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

test("records, updates, summarizes, and deletes a daily water entry", async ({
  page,
}) => {
  let entries: Record<string, unknown>[] = [];
  await page.route("**/api/v1/water**", async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      const input = route.request().postDataJSON();
      const created = {
        id: "water-1",
        ...input,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      entries = [created];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: created, meta: { timestamp } }),
      });
      return;
    }
    if (method === "PATCH") {
      const input = route.request().postDataJSON();
      const updated = { ...entries[0], ...input };
      entries = [updated];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: updated, meta: { timestamp } }),
      });
      return;
    }
    if (method === "DELETE") {
      entries = [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { success: true }, meta: { timestamp } }),
      });
      return;
    }
    const totalMl = entries.reduce(
      (total, entry) => total + Number(entry.amountMl),
      0,
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: entries,
        meta: {
          timestamp,
          pagination: { page: 1, limit: 100, total: entries.length, totalPages: 1 },
          summary: { totalMl },
        },
      }),
    });
  });

  await page.goto("/water");
  await page.getByLabel("Total intake (ml)").fill("2100");
  await page.getByLabel("Notes (optional)").fill("Water throughout the day");
  await page.getByRole("button", { name: "Save daily intake" }).click();

  await expect(page.getByText("Total for selected dates: 2,100 ml")).toBeVisible();
  await expect(page.getByText("2,100 ml · Water throughout the day")).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Total intake (ml)").fill("2300");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Total for selected dates: 2,300 ml")).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("No water entries for this date range.")).toBeVisible();
});

test("records measurements in profile units and compares measurement history", async ({
  page,
}) => {
  const prior = {
    id: "measurement-prior",
    date: "2026-10-01T00:00:00.000Z",
    weightKg: 75,
    waistCm: 84,
    chestCm: null,
    hipCm: null,
    bicepsCm: null,
    bodyFatPercent: null,
    notes: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  let measurements: Record<string, unknown>[] = [prior];

  await page.route("**/api/v1/profiles/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: profile, meta: { timestamp } }),
    });
  });
  await page.route("**/api/v1/measurements**", async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      const input = route.request().postDataJSON();
      const created = {
        id: "measurement-1",
        ...input,
        date: `${input.date}T00:00:00.000Z`,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      measurements = [created, prior];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: created, meta: { timestamp } }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: measurements,
        meta: {
          timestamp,
          pagination: {
            page: 1,
            limit: 100,
            total: measurements.length,
            totalPages: 1,
          },
        },
      }),
    });
  });

  await page.goto("/measurements");
  await expect(page.getByLabel("Weight (lb)")).toBeVisible();
  await page.getByLabel("Weight (lb)").fill("160");
  await page.getByLabel("Waist (cm)").fill("82");
  await page.getByRole("button", { name: "Save measurements" }).click();

  await expect(page.getByText("Measurement saved.")).toBeVisible();
  await expect(page.getByText("Weight: 160 lb")).toBeVisible();
  await expect(page.getByText("Waist: 82 cm")).toBeVisible();
  const posted = measurements[0];
  expect(posted.weightKg).toBeCloseTo(72.575, 3);
  await expect(page.getByRole("heading", { name: "Latest compared with previous" })).toBeVisible();
});
