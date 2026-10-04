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
- `GET /api/v1/dashboard/summary` — returns the authenticated account/profile overview, an empty recent-activity list, and explicit future-phase availability for tracking modules.

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

The dashboard currently reports `workouts` for Phase 4, `water` and `measurements` for Phase 5, and `goals` for Phase 6 as unavailable. No future tracking data is fabricated. Profile and dashboard payloads use the standard `data` / `meta` success envelope.

For this phase, `profileComplete` means the user has a nonblank display name and a height value. The preferred weight unit has a default and is not required for completion.

## 7. Future Workout and Exercise Endpoints

Likely endpoints:

- `GET /api/v1/workouts`
- `POST /api/v1/workouts`
- `GET /api/v1/workouts/:id`
- `PATCH /api/v1/workouts/:id`
- `DELETE /api/v1/workouts/:id`
- `GET /api/v1/exercises`
- `POST /api/v1/exercises`

Requirements:

- workouts and exercises are owned by the user
- a workout may include multiple exercise entries
- response payloads should include relevant nested data only when required

## 8. Future Water and Measurements Endpoints

Likely endpoints:

- `GET /api/v1/water`
- `POST /api/v1/water`
- `GET /api/v1/measurements`
- `POST /api/v1/measurements`

Requirements:

- logs are user-specific
- date-based queries and charts should be supported through filtering

## 9. Future Goals, Nutrition, and Plans Endpoints

Likely endpoints:

- `GET /api/v1/goals`
- `POST /api/v1/goals`
- `GET /api/v1/nutrition`
- `POST /api/v1/nutrition`
- `GET /api/v1/plans`
- `POST /api/v1/plans`

Requirements:

- plan entities remain lightweight in MVP
- nutrition intake tracking may be limited to basic records in the initial phase

## 10. Pagination, Filtering, and Sorting

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

## 11. Validation and Request Rules

- validate required fields and types
- reject malformed IDs or invalid date strings
- ensure numeric values are positive where expected
- reject overly large payloads when appropriate
- use consistent DTO validation on the backend

## 12. Authorization Rules

Every protected route must enforce authorization.

Rules:

- a user may access only their own records unless a future feature explicitly documents a share model
- resource IDs are not trusted as ownership proof
- frontend hiding of controls is not a substitute for server-side authorization

## 13. Versioning

The API uses path-based versioning:

```text
/api/v1/...
```

This maintains separation from future API changes without affecting the MVP design.

## 14. Idempotency and Safety

- use idempotency keys for sensitive or repeated writes when needed
- avoid unsafe or ambiguous delete semantics without confirmation
- treat create operations as explicit and validated actions

## 15. Open API / Contract Plan

The project intends to document the API explicitly as implementation begins. During the documentation-first phase, the exact OpenAPI or generated contract is not required, but the route conventions and domain resources should remain consistent with the broader product documentation.

## 16. Current Assumptions

Future endpoints above describe planned domain direction; they are not implemented Phase 3 routes. Add additional endpoint contracts only when the matching roadmap phase is approved.
