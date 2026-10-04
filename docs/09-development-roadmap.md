# Development Roadmap

## 1. Purpose

The roadmap is intentionally phased to ensure the project delivers the core fitness experience first and defers optional or speculative work until the product has real evidence supporting the need.

The phases below are the initial roadmap phases required by the master instruction.

## 2. Phase 1 — Project Setup

Objective:
- establish the repository structure, tooling, environment configuration, and project conventions

Scope:
- initialize repo and workspaces
- configure Next.js, NestJS, TypeScript, Tailwind, Prisma, Docker, Playwright, and CI defaults
- define environment templates and development scripts

Dependencies:
- project stack decisions
- technical standards

Acceptance criteria:
- project scaffolding is configured and documented
- environment variables are defined for key services
- Docker and local database setup are documented

Validation:
- dependencies install cleanly
- type checks and builds can run in baseline project setup

Exit gate:
- project setup must be stable before implementation of product features begins

## 3. Phase 2 — Authentication

Objective:
- provide secure user registration, login, logout, and token handling

Scope:
- auth module
- user account creation
- secure password handling
- token issuance and refresh flows
- protected route enforcement

Dependencies:
- project setup
- database design

Acceptance criteria:
- users can register and log in
- users cannot access protected data without authentication
- unauthorized access is rejected by the API

Validation:
- auth API tests
- E2E login flow

Exit gate:
- authentication must be secure and validated before profile or tracking features proceed

## 4. Phase 3 — Profile / Dashboard

Objective:
- deliver the user’s profile management and dashboard summary view

Scope:
- profile CRUD and settings
- dashboard cards and activity summary
- recent history presentation

Dependencies:
- authentication

Acceptance criteria:
- authenticated users can view and edit the display name, optional height, and preferred weight unit
- dashboard shows account/profile setup information
- tracking areas remain explicitly unavailable until their planned phases; no future-phase records are fabricated
- existing users receive a profile row through a reviewed migration

Validation:
- API service and endpoint tests for authenticated, owner-scoped profile/dashboard access and validation
- Playwright verification of profile editing, protected-route redirection, and dashboard empty/future-phase states

Exit gate:
- profile and dashboard data must be stable and user-owned before deep tracking modules proceed

## 5. Phase 4 — Workouts / Exercises

Objective:
- enable workout logging and exercise tracking

Scope:
- exercise catalog management
- workout records
- workout detail pages and history
- relationship between exercises and workouts

Dependencies:
- profile/dashboard

Acceptance criteria:
- users can create logs and view their history
- workout records are associated with the correct user account

Validation:
- integration tests for workout persistence
- Playwright flow for creating workouts

Exit gate:
- workout tracking must be validated before later health metrics are built on top of it

## 6. Phase 5 — Water / Measurements

Objective:
- capture daily health and body metrics

Scope:
- water intake logging
- measurements tracking over time
- trend review and comparison

Dependencies:
- workouts/exercises

Acceptance criteria:
- users can record daily water intake and measurements
- metrics can be reviewed over time

Validation:
- API and frontend validation for measurement flows

Exit gate:
- the measurement model must be consistent before advanced charting or goal integration is expanded

## 7. Phase 6 — Goals / Charts

Objective:
- help users set goals and monitor progress visually

Scope:
- goal creation and status tracking
- aggregation and charting of progress data
- dashboard integration

Dependencies:
- water/measurements

Acceptance criteria:
- users can create goals with target metrics
- goal progress is visible and tied to tracked data

Validation:
- goal API tests
- chart rendering verification in browser tests

Exit gate:
- goal logic must be accurate before nutrition and planning features depend on it

## 8. Phase 7 — Nutrition

Objective:
- allow basic nutrition tracking without turning this into a specialized diet platform

Scope:
- nutrition entries and summary views
- simple meal or intake tracking
- integration with dashboard and goals where relevant

Dependencies:
- goals/charts

Acceptance criteria:
- users can record basic nutrition entries
- entries are associated with the correct user

Validation:
- API and UI tests for nutrition logging

Exit gate:
- nutrition remains limited to the simplest meaningful scope for MVP

## 9. Phase 8 — Plans / Scheduling

Objective:
- support lightweight training plans and schedule tracking

Scope:
- plan creation
- scheduled workout items
- upcoming and historical plan review

Dependencies:
- workouts/exercises
- goals/charts

Acceptance criteria:
- users can create simple plans and track scheduled workouts
- plans remain lightweight and user-specific

Validation:
- plan management API tests
- E2E verification of plan flow

Exit gate:
- scheduling and plan logic must remain simple and not expand into a complex scheduling platform

## 10. Phase 9 — Optional Social Features

Objective:
- support optional social experiences only when there is a clear requirement and a secure design

Scope:
- friend connections or shared progress features
- optional public/private social views

Dependencies:
- core user and privacy models

Acceptance criteria:
- social features are opt-in and clearly documented
- privacy and authorization rules are implemented before release

Validation:
- security review and auth tests for any social access boundaries

Exit gate:
- do not begin this phase unless it is explicitly justified and documented

## 11. Phase 10 — Optional AI / Device Integrations

Objective:
- evaluate AI or wearable integrations only when meaningful product needs justify the added complexity

Scope:
- AI recommendations
- external device ingestion
- automated health data imports

Dependencies:
- core fitness tracking maturity
- security review and cost/benefit analysis

Acceptance criteria:
- integration boundary is documented
- privacy and moderation considerations are satisfied
- AI service remains separate from the core application unless justified otherwise

Validation:
- architecture review
- security and compliance checks

Exit gate:
- this phase should only begin after the core product is stable

## 12. Phase 11 — Testing / CI / CD Hardening

Objective:
- ensure the application is robust, verifiable, and release-ready

Scope:
- comprehensive CI pipeline
- linting and type checking
- unit/integration/E2E coverage
- migration validation and deployment checks
- release readiness

Dependencies:
- implementation phases

Acceptance criteria:
- the repo passes CI for relevant checks
- E2E paths cover significant product flows
- the release process is documented

Validation:
- GitHub Actions workflows
- targeted test suites and build validation

Exit gate:
- no later phase should begin if this phase reveals unresolved critical failures

## 13. Roadmap Safety

This roadmap intentionally keeps optional features outside the MVP and outside the initial implementation flow. Later phases are roadmap items only, not current requirements.
