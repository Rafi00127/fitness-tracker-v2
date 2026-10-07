# API Specification

## 1. API Scope and Conventions

The backend exposes a REST API under `/api/v1`.

The API must be:

- resource-oriented
- versioned
- validated
- authenticated where required
- authorized on protected resources
- predictable and consistent
- documented in relation to the product requirements

## 2. Base URL

```text
/api/v1
```

## 3. Response Conventions

All responses should use consistent JSON structures.

### Success response

```json
{
  "data": {},
  "meta": {
    "timestamp": "2026-09-27T00:00:00.000Z"
  }
}
```

### Error response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload is invalid.",
    "details": []
  }
}
```

## 4. Error Handling Conventions

Use standard HTTP status codes:

- 200 OK: request succeeded
- 201 Created: resource created
- 204 No Content: successful delete or update with no body
- 400 Bad Request: validation or malformed input
- 401 Unauthorized: missing or invalid authentication
- 403 Forbidden: authenticated but not allowed
- 404 Not Found: resource not found
- 409 Conflict: duplicate or conflicting state
- 422 Unprocessable Entity: semantic validation failure
- 500 Internal Server Error: unexpected server error

## 5. Authentication Endpoints

The following endpoints are expected at minimum:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`

Authentication requirements:

- registration creates a user and password hash
- login validates credentials and returns an access token
- registration and login set a refresh token in an HTTP-only cookie; the token is never included in JSON
- refresh rotates refresh tokens securely
- refresh and logout use the `refresh_token` cookie scoped to `/api/v1/auth`
- logout invalidates the presented refresh token and clears the cookie
- logout is idempotent and can be called without an access token; a presented refresh cookie is revoked before being cleared
- refresh returns the authenticated user and new access token while rotating the cookie
- browser credentialed requests are allowed only from `NEXT_PUBLIC_APP_URL`

Authentication success responses use the documented `data` and `meta` envelope. The refresh endpoint does not accept a refresh token in its JSON body.

## 6. Profile and Dashboard Endpoints

Implemented Phase 3 endpoints:

- `GET /api/v1/profiles/me` — returns the authenticated account and profile.
- `PATCH /api/v1/profiles/me` — updates the display name, optional height, and weight-unit preference.
- `GET /api/v1/dashboard/summary` — returns the authenticated account/profile overview, up to five most recent workouts, and availability for current/future tracking modules.

All three endpoints require a valid access-token bearer header. Ownership is derived from the verified token subject; these routes accept no user ID from the client.

Profile update fields are optional:

```json
{
  "name": "Member",
  "heightCm": 172.5,
  "weightUnit": "KG"
}
```

`name` may be `null` or an empty/whitespace string to clear it. `heightCm` may be `null` to clear it and otherwise must be between 30 and 300 cm. `weightUnit` is `KG` or `LB`. Unrecognized fields are rejected.

The dashboard reports workout, water, measurement, and goal tracking as
available and includes up to five most recent workouts. Goals are available in
Phase 6. No future tracking data is fabricated. Profile and dashboard payloads
use the standard `data` / `meta` success envelope.

For this phase, `profileComplete` means the user has a nonblank display name and a height value. The preferred weight unit has a default and is not required for completion.

## 7. Workouts and Exercises

Implemented Phase 4 endpoints (all require an access-token bearer header):

Exercises:

- `GET /api/v1/exercises` — list the authenticated user's exercises; supports `q`, `page`, and `limit`.
- `POST /api/v1/exercises` — create an exercise.
- `GET /api/v1/exercises/:id` — retrieve an exercise.
- `PATCH /api/v1/exercises/:id` — update supplied fields.
- `DELETE /api/v1/exercises/:id` — delete an unused exercise; returns conflict if workout history references it.

Workouts:

- `GET /api/v1/workouts` — list the authenticated user's workouts; supports `from`, `to`, `page`, and `limit`, ordered newest first.
- `POST /api/v1/workouts` — create a workout and optional exercise entries atomically.
- `GET /api/v1/workouts/:id` — retrieve a workout with its exercise entries.
- `PATCH /api/v1/workouts/:id` — update supplied workout fields. If `exerciseEntries` is included, it replaces the full entry list atomically; if omitted, entries are unchanged.
- `DELETE /api/v1/workouts/:id` — delete a workout and its entries.

Exercise create/update fields: `name` (required on create, 1-100 characters), optional `category` (up to 60 characters), and optional `notes` (up to 1000 characters). Names are trimmed; duplicates are allowed. PATCH may use `null` to clear `category` or `notes`; `name` cannot be null.

Workout create fields: `title` (required, 1-120 characters), `date` (ISO-8601 timestamp), optional `durationMinutes` (positive integer), optional `notes` (up to 2000 characters), and optional `exerciseEntries` (maximum 50). An entry has an existing `exerciseId`, plus optional positive integer `sets`, `reps`, and `durationSeconds`, optional `weight` from 0 to 99999.99 (up to two decimal places) in the user's preferred weight unit, and optional `notes` (up to 1000 characters). PATCH fields are optional; `durationMinutes`, `notes`, and optional entry scalar values may be set to `null` to clear them. `title` and `date` cannot be null, and `exerciseEntries` must be an array if supplied. The API rejects duplicate `exerciseId` values within one workout payload.

List pagination defaults to `page=1` and `limit=20`; `limit` is capped at 100. `from` and `to` are inclusive ISO-8601 timestamp filters. `q` searches exercise name/category. Responses use the standard success envelope; list responses include `meta.pagination`.

All lookup and mutation ownership derives from the verified token subject. A workout cannot reference another user's exercise. Water and measurements are implemented in Phase 5, goals in Phase 6, and nutrition in Phase 7. Plans remain future work.

## 8. Water and Measurement Endpoints

All routes require an access-token bearer header.

Water:

- `GET /api/v1/water?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20` — list daily entries and return `meta.summary.totalMl` for the selected range.
- `POST /api/v1/water` — create a daily water total with `date`, positive integer `amountMl`, and optional `notes`.
- `GET /api/v1/water/:id`, `PATCH /api/v1/water/:id`, and `DELETE /api/v1/water/:id` — retrieve or manage an owned daily entry.

There is one entry per user-selected calendar date. Creating a second entry for the same date returns conflict; update the existing entry instead. Date filters are inclusive, date-only values (`YYYY-MM-DD`), and response amounts are in milliliters.

Measurements:

- `GET /api/v1/measurements?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20` — list owned measurement snapshots, newest first.
- `POST /api/v1/measurements` — create a date-only snapshot.
- `GET /api/v1/measurements/:id`, `PATCH /api/v1/measurements/:id`, and `DELETE /api/v1/measurements/:id` — retrieve or manage an owned snapshot.

Measurement bodies accept optional `weightKg`, `waistCm`, `chestCm`, `hipCm`, `bicepsCm`, `bodyFatPercent`, and `notes`; create requires at least one non-null measurement value. Weight uses three decimal places; other values use two, body fat is 0-100, and dimensions/weight must be positive. PATCH may use `null` to clear values, but the resulting record must retain at least one measurement. Multiple snapshots per date are supported. Weight uses kg in the API and storage; the UI converts to/from the profile's preferred unit. Dates are calendar dates, not timestamps.

Lists use the standard `data` / `meta` envelope with pagination. User ownership is derived from the verified access-token subject. The Phase 5 water entry API does not itself define daily targets; Phase 6 targets are represented by the separate Goals resource.

## 9. Goals and Progress Endpoints

All goal endpoints require an access-token bearer header:

- `GET /api/v1/goals` — list the authenticated user's goals with current
  derived progress.
- `POST /api/v1/goals` — create a goal.
- `GET /api/v1/goals/:id`, `PATCH /api/v1/goals/:id`, and
  `DELETE /api/v1/goals/:id` — manage an owned goal.
- `GET /api/v1/goals/progress?from=YYYY-MM-DD&to=YYYY-MM-DD` — return
  owner-scoped water, workout, and weight history for charts.

Supported goal metrics:

- `DAILY_WATER_ML`: target is an integer from 1 through 100000 milliliters; current
  value is today's UTC-date water total, or zero if no entry exists.
- `WEEKLY_WORKOUTS`: target is an integer from 1 through 7; current value is
  the workout count for the current UTC Monday-to-Sunday week.
- `TARGET_WEIGHT_KG`: target is a positive kilogram value up to 9999.99 kg;
  create requires a
  prior weight measurement. The latest measurement at creation is retained as
  the baseline and target direction is inferred from it.

Goal input includes a required title and metric-specific `targetValue`, with
an optional date-only `targetDate`. Goal metric cannot be changed in PATCH.
Current value, capped progress percentage, and `ACTIVE`, `COMPLETED`, or
`OVERDUE` status are derived at read time. A target date is overdue only after
that calendar date and while the target is unmet. Responses use the standard
success envelope. Lists include pagination where applicable.

Chart history returns only persisted values in the requested inclusive date
range, ordered chronologically; absent records are not synthesized as
zero-valued activity. The range is limited to 365 days.

## 10. Nutrition Endpoints

All endpoints require an access-token bearer header and derive ownership from
the verified token subject.

- `GET /api/v1/nutrition?page=1&limit=20&from=YYYY-MM-DD&to=YYYY-MM-DD`
  lists the user's entries newest date first. Date filters are optional and
  inclusive; pagination uses the standard list envelope.
- `POST /api/v1/nutrition` creates an entry with required `date` and
  `description`, and optional `caloriesKcal`, `proteinGrams`, `carbsGrams`,
  `fatsGrams`, and `notes`.
- `GET /api/v1/nutrition/:id`, `PATCH /api/v1/nutrition/:id`, and
  `DELETE /api/v1/nutrition/:id` read, update, or delete one owned entry.
- `GET /api/v1/nutrition/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` returns
  inclusive-range totals independent of list pagination.

The summary `data` contains `entryCount` and one object each for
`caloriesKcal`, `proteinGrams`, `carbsGrams`, and `fatsGrams`. Each nutrient
object contains `recordedEntryCount` and `total`; `total` is zero when no
values were recorded, and clients should use the count to display that no
value was logged rather than implying an actual zero intake.

The summary requires both dates, and its inclusive date range is limited to
365 days. For list filtering, the same limit applies when both optional bounds
are supplied. `description` is 1-120 characters;
`notes` is at most 1000 characters. Calories are whole kcal from 0 to 10000;
each optional macro is a decimal from 0 to 1000 grams, stored to two decimal
places. Missing values are excluded from that nutrient's sum and are not
interpreted as zero. Summary responses include the entry count and, for each
nutrient, its recorded-value count and sum, so clients can disclose that
totals include only logged values. The API does not infer nutrients or provide
nutrition advice.

## 11. Plans and Scheduling Endpoints

All plan and schedule endpoints require an access-token bearer header. The
authenticated token subject supplies the owner scope.

Plans:

- `GET /api/v1/plans?page=1&limit=20` lists the user's plans.
- `POST /api/v1/plans` creates a plan with a required `name` (1-100
  characters), optional `description` (up to 1000 characters), and optional
  date-only `startDate` / `endDate`.
- `GET /api/v1/plans/:id` returns an owned plan and its dated items.
- `PATCH /api/v1/plans/:id` updates supplied plan fields. Dates may be set to
  `null`; start date must not be later than end date.
- `DELETE /api/v1/plans/:id` deletes the plan and its scheduled items, not
  the referenced workout records.

Scheduled items:

- `GET /api/v1/plans/:planId/items?page=1&limit=20` lists items in the plan.
- `POST /api/v1/plans/:planId/items` creates an item with required `title`
  (1-120 characters) and date-only `scheduledDate`, and optional `notes` (up
  to 1000 characters).
- `PATCH /api/v1/plans/:planId/items/:itemId` updates item fields and may
  set `workoutId` to an owned workout ID or `null`. Linking marks the item
  complete. `completed` may be set to `true` or `false` for manual completion;
  an item linked to a workout cannot be marked incomplete until unlinked.
- `DELETE /api/v1/plans/:planId/items/:itemId` deletes only the scheduled
  item.
- `GET /api/v1/plans/schedule?view=upcoming|history&page=1&limit=20` returns
  the user's dated items with their parent plan and optional linked workout.
  Upcoming includes today and future dates in UTC; history includes dates
  before today. Results are ordered by scheduled date, then creation time.

The API rejects invalid date ranges, unknown fields, and links to workouts
outside the authenticated user's ownership. A logged workout can be linked
to at most one scheduled item. Removing a linked workout sets the optional
link to null but preserves the session's completed state. Plan dates and
schedule items are calendar-date based, with no recurrence or time-of-day
scheduling. When plan date bounds are set, each scheduled date must fall
within those bounds; updates that exclude existing items are rejected.

## 12. Pagination, Filtering, and Sorting

## 11. Pagination, Filtering, and Sorting

For list endpoints, the API should support:

- `page`
- `limit`
- `sort`
- `order`
- date-range filters
- category filters where relevant

Example:

```text
GET /api/v1/workouts?page=1&limit=20&sort=date&order=desc
```

## 13. Validation and Request Rules

- validate required fields and types
- reject malformed IDs or invalid date strings
- ensure numeric values are positive where expected
- reject overly large payloads when appropriate
- use consistent DTO validation on the backend

## 14. Authorization Rules

Every protected route must enforce authorization.

Rules:

- a user may access only their own records unless a future feature explicitly documents a share model
- resource IDs are not trusted as ownership proof
- frontend hiding of controls is not a substitute for server-side authorization

## 15. Versioning

The API uses path-based versioning:

```text
/api/v1/...
```

This maintains separation from future API changes without affecting the MVP design.

## 16. Idempotency and Safety

- use idempotency keys for sensitive or repeated writes when needed
- avoid unsafe or ambiguous delete semantics without confirmation
- treat create operations as explicit and validated actions

## 17. Open API / Contract Plan

The project intends to document the API explicitly as implementation begins. During the documentation-first phase, the exact OpenAPI or generated contract is not required, but the route conventions and domain resources should remain consistent with the broader product documentation.

## 18. Current Assumptions

The workout edit child-list replacement rule and exercise-delete conflict behavior are conservative Phase 4 choices, not immutable product requirements. Exercise taxonomy and whether duplicates should be forbidden remain open decisions; categories are free text and names may repeat until specified otherwise. The Phase 6 goal metric set and UTC progress windows are conservative initial choices; adding metrics or manual progress requires an approved requirement. Phase 7 nutrition routes implement manually recorded entries and summaries only. Phase 8 uses date-only schedule items, manual completion or optional owner-validated workout links, and no recurring schedule rules.
