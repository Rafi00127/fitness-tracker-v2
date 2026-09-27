# Project AI Instructions

This file is the project-specific operating manual for AI agents working on Fitness Tracker V2.

## Master Source of Truth

The authoritative instruction is:

- [AI_MASTER_INSTRUCTIONS.md](./AI_MASTER_INSTRUCTIONS.md)

If there is any conflict between project documentation and the master instruction, the master instruction wins and the conflict must be recorded.

## Core Rules

1. Read the project requirement and architecture docs before changing code.
2. Do not silently invent business requirements.
3. Keep implementation scoped to a small, verifiable phase.
4. Document requirements, architecture, and decisions before large changes.
5. Preserve consistency across product, architecture, database, API, UI, security, and tests.
6. Keep the initial system as a modular monolith unless there is a clear need for decomposition.
7. Use the selected stack consistently: Next.js, React, TypeScript, Tailwind CSS, NestJS, PostgreSQL, Prisma, REST under `/api/v1`, Docker, Playwright, and GitHub Actions.
8. Treat health and fitness data as sensitive.
9. Validate meaningful changes with relevant linting, type checking, tests, and builds.
10. Report what changed, what was validated, and any unresolved assumptions.

## Expected Architecture

The default system shape is:

```text
Clients
  ↓
Next.js Web App
  ↓
REST API
  ↓
NestJS Modular Backend
  ↓
PostgreSQL
```

The backend is organized by business domains, not a single large service. Examples of module boundaries include auth, users, workouts, exercises, water, goals, measurements, nutrition, and plans.

## MVP Boundaries

The MVP must focus on the core fitness-tracking experience only. Optional features such as social features and AI/device integrations remain future scope and must not be treated as required MVP functionality.

## Documentation Requirements

Before major implementation work, create or update the required documentation set in the project root and `docs/` directory. This includes root project docs and all numbered architecture and operational docs required by the master instruction.

## Quality Expectations

Every meaningful feature should include:

- clear requirements
- affected architecture notes
- database or API contract impacts where relevant
- UI considerations where relevant
- security and authorization review
- test plan
- validation evidence

## Critical Security and Authorization Rules

- Never commit secrets or private credentials.
- Use environment variables for sensitive values.
- Treat client-side checks as cosmetic. Authorization must be enforced on the server.
- Users should only access their own records unless explicit sharing is documented.
- Do not construct SQL from untrusted input.
- Avoid exposing sensitive data in logs or errors.

## Documentation and Implementation Workflow

```text
READ
 ↓
UNDERSTAND
 ↓
PLAN
 ↓
DOCUMENT
 ↓
IMPLEMENT
 ↓
TEST
 ↓
REVIEW
 ↓
REPORT
```

## Open Decision Format

When a requirement is ambiguous, document it explicitly using the project’s preferred format:

```text
Open Decision:
Question:
Why it matters:
Current assumption:
Impact:
```

## Required Reading

Before implementing or changing architecture, confirm alignment with the following documents:

- [AI_MASTER_INSTRUCTIONS.md](./AI_MASTER_INSTRUCTIONS.md)
- [README.md](./README.md)
- [docs/01-product-requirements.md](./docs/01-product-requirements.md)
- [docs/02-system-architecture.md](./docs/02-system-architecture.md)
- [docs/03-database-design.md](./docs/03-database-design.md)
- [docs/04-api-specification.md](./docs/04-api-specification.md)
- [docs/06-authentication-authorization.md](./docs/06-authentication-authorization.md)
- [docs/07-security.md](./docs/07-security.md)
- [docs/08-testing-strategy.md](./docs/08-testing-strategy.md)
- [docs/09-development-roadmap.md](./docs/09-development-roadmap.md)

## Final Instruction

The project is documentation-first. Do not begin implementation of application source code until the required docs are current, internally consistent, and aligned with the master instructions. Then proceed in small, testable phases only.
