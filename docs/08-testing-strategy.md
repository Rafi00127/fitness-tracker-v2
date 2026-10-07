# Testing Strategy

## 1. Purpose of Testing

Testing is required as part of implementation, not as a final cleanup step. The project must include a meaningful testing strategy that matches the complexity of the application and the product requirements.

## 2. Testing Layers

### Unit tests

Used for isolated logic, such as:

- validation helpers
- auth utility functions
- date or metric calculations
- transformation logic
- service-level rules that do not depend on the full stack

### Integration tests

Used to validate important interaction paths between components, especially:

- service-to-database flows
- module orchestration
- Prisma and backend service coordination
- ownership enforcement logic

### API tests

Required for:

- authentication success and failure
- authorization enforcement
- validation failures
- not-found and conflict handling
- user-owned resource boundary checks

### End-to-end tests

Use Playwright for critical user journeys, for example:

- registration
- login
- dashboard access
- logging a workout
- logging water
- recording a measurement
- creating a goal

## 3. Playwright Strategy

Playwright should cover the highest-value user journeys that provide confidence in the application behavior.

Recommended E2E focus:

- happy path registration/login
- protected-route redirection
- dashboard loads with empty or sample data
- workout creation flow
- water entry flow
- measurement tracking flow
- goal creation and progress summary
- nutrition entry create/edit/delete and date-range summary

Do not add broad E2E coverage for low-value or speculative UI states.

## 4. Test Data Strategy

Use deterministic, isolated test data for each layer.

Good patterns:

- factory utilities for users and records
- seeded test users with known credentials
- minimal realistic datasets for dashboard and chart flows
- data cleanup between tests where required

## 5. CI Test Strategy

CI should run the relevant validation set for the repository, including:

- dependency installation
- linting
- type checking
- unit tests
- integration/API tests
- E2E tests where appropriate
- production build

## 6. Coverage Expectations

The project should aim for coverage that is meaningful rather than arbitrary. Coverage should prioritize:

- auth flows
- authorization boundaries
- critical domain logic
- database persistence flows
- user journeys that directly affect product value

## 7. Regression Testing

Before feature completion and before merging changes, the project should run the relevant regressions for impacted behavior. This is especially important for:

- auth changes
- database schema migrations
- API contract changes
- user dashboard or tracking flows

## 8. Current Test Assumptions

The Playwright suite uses one worker by default. A four-worker run exhausted
memory in the current development environment, while the serial suite passes.
Increase parallelism only after confirming the target environment has enough
memory.

Phase 3 adds API service tests for profile ownership-scoped lookups/updates and dashboard summary behavior, plus API endpoint tests for authentication, validation, and authenticated user scoping. Playwright covers signed-out dashboard redirection, dashboard empty/future-phase states, and profile editing. The API tests mock persistence and browser tests intercept the API; neither requires a running PostgreSQL instance. Prisma schema validation does not require a live database, but applying the profile backfill migration requires PostgreSQL.

Phase 3's migration and live service flow were also smoke-tested against the local Docker Compose PostgreSQL/API stack using a temporary account that was removed after verification.

Phase 4 adds service and endpoint coverage for workout/exercise CRUD, validation, nested exercise ownership, date filtering, and delete behavior. Playwright covers exercise creation and a workout create/history/detail journey. Persistence integration tests use the local Compose database only with temporary test accounts/records that are deleted by the test; unit/API tests mock persistence. Never reset the development or production database to prepare test fixtures.

Phase 5 adds service and authenticated endpoint coverage for daily water totals, measurement snapshots, date filters, validation, and owner scoping. Playwright covers water create/update/delete and range summaries, plus measurement entry, profile-unit conversion, history, and comparison. Migration deployment and live API smoke tests use the local Compose PostgreSQL stack and temporary account data that is removed after each run; do not reset the database.

Phase 6 adds goal service tests for metric validation, baseline capture,
time-window progress, completion/overdue status, and owner scoping. Authenticated
endpoint tests cover CRUD, progress data, invalid metrics, and cross-account
isolation. Playwright covers goal creation/edit/delete, auto-derived progress,
chart history, and dashboard integration. Chart tests verify labels and
recorded values rather than relying only on visual appearance.

Phase 7 adds service and authenticated endpoint tests for nutrition CRUD,
numeric/date validation, inclusive range summaries, nullable nutrient
aggregation, pagination, and owner isolation. Playwright covers entry
creation/edit/deletion and the selected-range summary, including empty and
error states. Apply the additive migration and smoke-test with temporary local
accounts only; never reset a database containing user data.

Phase 8 adds plan and scheduled-item service/API tests for validation,
date-bound consistency, nested ownership, workout-link ownership and
uniqueness, manual completion, link/unlink behavior, and safe deletion.
Playwright covers plan creation, scheduling, completion, linking a logged
workout, and upcoming/history review. Migration and live smoke validation use
the local database only; never reset a database containing user data.
