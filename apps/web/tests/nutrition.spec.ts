import { expect, test } from "@playwright/test";

const user = { id: "user-1", email: "member@example.com", name: "Member" };
const accessToken = "phase-seven-access-token";
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

test("logs, edits, summarizes, and deletes manually recorded nutrition", async ({
  page,
}) => {
  let entries: Array<Record<string, unknown>> = [];
  await page.route("**/api/v1/nutrition**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname.endsWith("/summary")) {
      const rangeEntries = entries.filter((entry) => {
        const date = String(entry.date).slice(0, 10);
        return date >= url.searchParams.get("from")! &&
          date <= url.searchParams.get("to")!;
      });
      const sum = (key: string) => {
        const recorded = rangeEntries
          .map((entry) => entry[key])
          .filter((value): value is number => typeof value === "number");
        return {
          recordedEntryCount: recorded.length,
          total: recorded.reduce((total, value) => total + value, 0),
        };
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            entryCount: rangeEntries.length,
            caloriesKcal: sum("caloriesKcal"),
            proteinGrams: sum("proteinGrams"),
            carbsGrams: sum("carbsGrams"),
            fatsGrams: sum("fatsGrams"),
          },
          meta: { timestamp },
        }),
      });
      return;
    }

    if (method === "POST") {
      const input = request.postDataJSON();
      const entry = {
        id: "nutrition-1",
        ...input,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      entries = [entry];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: entry, meta: { timestamp } }),
      });
      return;
    }

    if (method === "PATCH") {
      const input = request.postDataJSON();
      entries = entries.map((entry) => ({ ...entry, ...input }));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: entries[0], meta: { timestamp } }),
      });
      return;
    }

    if (method === "DELETE") {
      entries = [];
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

    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const filtered = entries.filter((entry) => {
      const date = String(entry.date).slice(0, 10);
      return (!from || date >= from) && (!to || date <= to);
    });
    const pageNumber = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const items = filtered.slice((pageNumber - 1) * limit, pageNumber * limit);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: items,
        meta: {
          timestamp,
          pagination: {
            page: pageNumber,
            limit,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / limit),
          },
        },
      }),
    });
  });

  await page.goto("/nutrition");
  await expect(page.getByRole("heading", { name: "Nutrition log" })).toBeVisible();
  await expect(page.getByText("No nutrition entries for this date range.")).toBeVisible();
  await expect(page.getByText("No recorded values").first()).toBeVisible();

  await page.getByLabel("Meal or intake description").fill("Oatmeal and yogurt");
  await page.getByLabel("Calories (kcal)").fill("420");
  await page.getByLabel("Protein (g)").fill("22.5");
  await page.getByLabel("Carbohydrates (g)").fill("54");
  await page.getByLabel("Fat (g)").fill("12");
  await page.getByLabel("Notes (optional)").fill("Before training");
  await page.getByRole("button", { name: "Save nutrition entry" }).click();

  await expect(page.getByText("Nutrition entry saved.")).toBeVisible();
  await expect(page.getByText("420 kcal", { exact: true })).toBeVisible();
  await expect(page.getByText("420 kcal", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("22.5 g", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("1 entry in this date range.")).toBeVisible();

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Calories (kcal)").fill("450");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Nutrition entry updated.")).toBeVisible();
  await expect(page.getByText("450 kcal", { exact: false }).first()).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Nutrition entry deleted.")).toBeVisible();
  await expect(page.getByText("No nutrition entries for this date range.")).toBeVisible();
});

test("shows nutrition service errors without hiding the failure", async ({
  page,
}) => {
  await page.route("**/api/v1/nutrition**", async (route) => {
    if (new URL(route.request().url()).pathname.endsWith("/summary")) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "SERVICE_UNAVAILABLE", message: "Nutrition is offline." },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        meta: {
          timestamp,
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      }),
    });
  });

  await page.goto("/nutrition");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Nutrition is offline.",
  );
});
