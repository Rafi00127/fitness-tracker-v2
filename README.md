# Fitness Tracker V2

## Purpose

Fitness Tracker V2 is a secure, maintainable, and modular fitness-tracking platform designed to help users track training, hydration, body changes, nutrition, goals, and progress over time. The project follows a documentation-first, phased delivery model and is intentionally designed to start as a modular monolith before any service decomposition is justified.

The initial scope focuses on the core user journey: sign up, authenticate, manage profile information, review dashboards, log workouts and exercises, track water intake, record measurements, set goals, and monitor progress.

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- NestJS
- PostgreSQL
- Prisma
- REST API under `/api/v1`
- Docker / Docker Compose
- Playwright
- GitHub Actions

## Repository Direction

The project is intended to evolve as a monorepo capable of supporting web, API, shared packages, docs, and automation work. The initial architecture is a modular monolith with clear business-domain boundaries rather than a microservice-first design.

Recommended structure:

```text
fitness-tracker-v2/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── config/
│   ├── types/
│   └── ui/
├── docs/
├── prisma/
├── docker/
├── tests/
├── .github/
├── README.md
├── PROJECT_AI_INSTRUCTIONS.md
├── AI_MASTER_INSTRUCTIONS.md
├── package.json
└── ...
```

This repository structure is a direction, not a requirement to create every package immediately. Packages are added only when there is a real purpose.

## Project Documentation

This project follows the authoritative instructions in:

- [AI_MASTER_INSTRUCTIONS.md](./AI_MASTER_INSTRUCTIONS.md)
- [PROJECT_AI_INSTRUCTIONS.md](./PROJECT_AI_INSTRUCTIONS.md)
- [docs/](./docs)

Key documents:

- [docs/01-product-requirements.md](./docs/01-product-requirements.md)
- [docs/02-system-architecture.md](./docs/02-system-architecture.md)
- [docs/03-database-design.md](./docs/03-database-design.md)
- [docs/04-api-specification.md](./docs/04-api-specification.md)
- [docs/05-ui-ux-specification.md](./docs/05-ui-ux-specification.md)
- [docs/06-authentication-authorization.md](./docs/06-authentication-authorization.md)
- [docs/07-security.md](./docs/07-security.md)
- [docs/08-testing-strategy.md](./docs/08-testing-strategy.md)
- [docs/09-development-roadmap.md](./docs/09-development-roadmap.md)
- [docs/10-database-migrations.md](./docs/10-database-migrations.md)
- [docs/11-error-handling.md](./docs/11-error-handling.md)
- [docs/12-logging-monitoring.md](./docs/12-logging-monitoring.md)
- [docs/13-environment-configuration.md](./docs/13-environment-configuration.md)
- [docs/14-docker.md](./docs/14-docker.md)
- [docs/15-ci-cd.md](./docs/15-ci-cd.md)
- [docs/16-git-workflow.md](./docs/16-git-workflow.md)
- [docs/17-definition-of-done.md](./docs/17-definition-of-done.md)
- [docs/18-architecture-decisions.md](./docs/18-architecture-decisions.md)
- [docs/19-ai-development-prompts.md](./docs/19-ai-development-prompts.md)
- [docs/20-project-checklist.md](./docs/20-project-checklist.md)

## Local Development Workflow

1. Review the product and architecture documents before making changes.
2. Validate assumptions against the master instructions.
3. Implement the smallest safe phase change.
4. Run relevant formatting, linting, type checking, tests, and build validation.
5. Update affected documentation if requirements or implementation details change.
6. Report progress clearly and note open decisions.

## Current Implementation Status

Phases 1-8 feature implementation and automated validation are complete. Phase
8's local PostgreSQL migration and integrated-stack verification remain to be
confirmed. Phase 6 adds private goals
for daily water, weekly workouts, and target body weight, with progress derived
from existing records and accessible history charts. Phase 7 adds private,
manual nutrition entries and date-range summaries based only on values users
recorded.

The workouts/exercises, water/measurements, goals, and nutrition migrations
are applied to the local PostgreSQL database. Phase 8's plan migration should
be applied and verified separately. Phase 7 does not estimate
missing nutrient values or include a food catalog or diet advice. The web app
and API run at `http://localhost:3000` and `http://localhost:3001`.
After signing in, open `http://localhost:3000/nutrition` to log meals and
review recorded-value summaries, or `/goals` to manage progress goals.

To run the API locally, copy `.env.example` to `.env`, replace both auth-secret placeholders with different random values of at least 32 UTF-8 bytes, start PostgreSQL with Docker Compose, then from the repository root run:

```powershell
npm run db:generate
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

Run the web and API apps with `npm run dev:web` and `npm run dev:api`. The browser calls same-origin `/api/v1` routes, which Next.js proxies to the API using `API_INTERNAL_URL` (defaults to `http://localhost:3001`). API unit/endpoint tests mock persistence and Playwright tests mock API responses; these checks do not require PostgreSQL. Applying the profile, workouts, water, measurements, goals, nutrition, and plans migrations requires PostgreSQL.

## Environment Setup

The project should use environment variables for configuration and secrets. The exact values are not committed to version control.

Required configuration categories include:

- Next.js app variables
- NestJS API variables
- PostgreSQL connection settings
- Prisma database connection
- auth secret values
- optional external AI integration values (future use only)

A sample environment template is documented in [docs/13-environment-configuration.md](./docs/13-environment-configuration.md).

## Database Setup

The initial database is PostgreSQL with Prisma as the ORM. Migrations are the supported path for schema change management.

Database design and migration expectations are documented in:

- [docs/03-database-design.md](./docs/03-database-design.md)
- [docs/10-database-migrations.md](./docs/10-database-migrations.md)

## Testing Strategy

Testing is required for meaningful functionality. The project includes:

- unit tests for business logic
- integration tests for service and persistence flows
- API tests for auth, authorization, and validation
- Playwright end-to-end testing for critical user journeys
- CI validation for linting, type checking, test execution, and build verification

See [docs/08-testing-strategy.md](./docs/08-testing-strategy.md) and [docs/15-ci-cd.md](./docs/15-ci-cd.md).

## Security Expectations

This application handles fitness and health-related data, which must be treated as sensitive. The project must enforce:

- secure secret management
- input validation and server-side authorization
- least-privilege access
- safe error handling without leaking internals
- structured logging without exposing secrets or tokens

See [docs/06-authentication-authorization.md](./docs/06-authentication-authorization.md), [docs/07-security.md](./docs/07-security.md), and [docs/12-logging-monitoring.md](./docs/12-logging-monitoring.md).

## Roadmap Summary

The project roadmap begins with foundational setup and proceeds through authentication, profile/dashboard, workouts and exercises, water and measurements, goals and charts, nutrition, plans and scheduling, then optional social and AI/device integrations. Phase 8 plans and scheduling are implemented as a later phase and are not an initial MVP requirement.

This is intentionally staged so later phases do not become MVP requirements. The full roadmap is documented in [docs/09-development-roadmap.md](./docs/09-development-roadmap.md).

## MVP Scope

The initial MVP is limited to the core fitness-tracking flows that are directly aligned with the project mission and technology stack. It does not include optional social or AI/device features as required functionality.

## Assumptions and Open Decisions

This project documentation uses a conservative approach when details are not yet specified. Assumptions are documented in the relevant requirement and design files, including:

- social features remain optional and are not part of MVP;
- AI/device integrations are explicitly future-phase items;
- single-user ownership is the default authorization model unless explicit sharing is introduced later;
- the application will keep a simple modular-monolith architecture until complexity requires decomposition.

## Validation Status

Phases 1-8 feature implementation and automated checks are complete. The
Phase 8 plan migration still needs local PostgreSQL and integrated-stack
verification. Plans are private and use date-only scheduled sessions, manual
completion, optional links to logged workouts, and upcoming/history review.
Nutrition records remain manually entered and owner-private, with no estimates,
food catalog, or diet advice. Production database rollout requires its own
review.

## Recommended Next Task

Apply and smoke-test the Phase 8 migration against local PostgreSQL without
resetting existing data. Social, AI, and device integrations remain out of
scope unless explicitly requested.
