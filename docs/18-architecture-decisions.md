# Architecture Decisions

## 1. ADR Format

This document records important project decisions in an ADR-style format.

## 2. ADR 001 — Use Next.js

Status: Accepted

Context:
- The project requires a modern web frontend.
- The master instruction explicitly chooses Next.js over Vite.

Decision:
- Use Next.js with React and TypeScript for the web client.

Consequences:
- Frontend development follows a framework with SSR and app-router conventions.
- The stack aligns with the project’s technical direction.
- The team must maintain a clear separation between UI and backend concerns.

Alternatives considered:
- Vite-based React app
- custom client-only frontend

## 3. ADR 002 — Use NestJS

Status: Accepted

Context:
- The project requires a maintainable backend API.
- The stack requires NestJS and TypeScript.

Decision:
- Use NestJS as the main backend service with modular domain structure.

Consequences:
- Backend modules can align with fitness domains and stay maintainable.
- The architecture supports a modular monolith initially.
- Future decomposition is possible only if justified by real complexity.

Alternatives considered:
- Express without framework structure
- microservice-first architecture

## 4. ADR 003 — Use PostgreSQL

Status: Accepted

Context:
- The application stores sensitive user health and fitness data.
- The project requires PostgreSQL.

Decision:
- Use PostgreSQL as the primary relational database.

Consequences:
- The system gets a robust relational model for user-owned records.
- The team must design careful ownership and security rules.
- Prisma will integrate cleanly with PostgreSQL.

Alternatives considered:
- SQLite for local development only
- NoSQL options

## 5. ADR 004 — Use Prisma

Status: Accepted

Context:
- The project requires Prisma.
- The data model is relational and user-owned.

Decision:
- Use Prisma as the schema and migration layer.

Consequences:
- Database evolution will happen through migrations.
- The project must maintain consistent Prisma model design and review.
- The team should avoid switching ORM frameworks without explicit approval.

Alternatives considered:
- TypeORM
- raw SQL with no ORM

## 6. ADR 005 — Use REST under /api/v1

Status: Accepted

Context:
- The master instruction specifies a REST API under `/api/v1`.

Decision:
- Use REST as the primary API architecture and version it under `/api/v1`.

Consequences:
- Resource-oriented endpoints remain straightforward for a modular monolith.
- The team must keep API contracts consistent and documented.
- GraphQL and gRPC are intentionally excluded unless a future requirement justifies them.

Alternatives considered:
- GraphQL-first API
- event-driven service design

## 7. ADR 006 — Use Modular Monolith Initially

Status: Accepted

Context:
- The project requires a maintainable architecture that stays simple until justified.

Decision:
- Begin as a modular monolith with domain-oriented modules and a central database.

Consequences:
- The system remains simpler and easier to test early on.
- Future service boundaries can be introduced only when real need is demonstrated.
- The team must not prematurely create unnecessary microservices.

Alternatives considered:
- service-oriented architecture from day one
- monolith without modular organization

## 8. ADR 007 — Use Monorepo Direction

Status: Accepted

Context:
- The project may evolve across web app, API, shared packages, and docs.

Decision:
- Keep the repo in a monorepo-friendly structure with the option to create packages only when justified.

Consequences:
- Shared concerns can be organized cleanly without over-engineering early.
- The team should avoid creating every package prematurely.

Alternatives considered:
- single-package app repo
- over-scoped multi-package setup from the beginning

## 9. ADR 008 — Delay AI and Social Features

Status: Accepted

Context:
- The roadmap includes optional AI/device and social features, but they are not MVP requirements.

Decision:
- Treat social and AI/device features as later-phase work that depends on actual product need and review.

Consequences:
- MVP remains focused and manageable.
- Future features require separate requirements and security review before implementation.

Alternatives considered:
- building social modules or AI integration into MVP
- designing for every future scenario immediately
