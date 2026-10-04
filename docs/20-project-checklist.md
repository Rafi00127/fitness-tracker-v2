# Project Checklist

## 1. Setup

- [ ] repository structure is documented and intentional
- [ ] project stack is consistent with the master instruction
- [ ] required root docs exist
- [ ] environment configuration is planned and documented

## 2. Documentation

- [ ] README is current and links to required docs
- [ ] PROJECT_AI_INSTRUCTIONS.md references the master instruction
- [ ] product requirements document is aligned with current scope
- [ ] architecture document reflects modular monolith direction
- [ ] roadmap distinguishes MVP from future phases

## 3. Architecture

- [ ] frontend, API, and database boundaries are clear
- [ ] modular backend structure is planned by business domain
- [ ] REST under `/api/v1` is documented
- [ ] architecture remains simple until complexity justifies expansion

## 4. Database

- [ ] PostgreSQL is the required database
- [ ] Prisma is used as the ORM and migration layer
- [ ] important tables and relationships are documented
- [ ] ownership rules and privacy expectations are explicit
- [ ] migration workflow is documented

## 5. Backend

- [ ] API contracts are resource-oriented and documented
- [ ] authentication and authorization are separated
- [ ] validation and error handling are specified
- [ ] sensitive data handling is defined

## 6. Frontend

- [ ] Next.js + React + TypeScript + Tailwind are documented as the frontend baseline
- [ ] dashboard and management screens are scoped appropriately
- [ ] loading, empty, error, and validation states are documented
- [ ] accessibility expectations are considered

## 7. Authentication

- [ ] registration and login are documented
- [ ] token/session strategy is defined
- [ ] authorization model is owner-first by default
- [ ] protected resources are clearly identified

## 8. Security

- [ ] secrets are managed via environment configuration
- [ ] user health and fitness data is treated as sensitive
- [ ] authorization is server-side only
- [ ] unsafe SQL and data exposure patterns are avoided

## 9. Tests

- [ ] unit, integration, API, and E2E strategy is documented
- [ ] Playwright is identified for critical user journeys
- [ ] CI validation path is described

## 10. Docker

- [ ] local PostgreSQL and service orchestration are planned
- [ ] container workflows and health checks are considered

## 11. CI / CD

- [ ] GitHub Actions validation steps are documented
- [ ] build and test gates are defined
- [ ] migration validation guidance is present

## 12. Deployment and Release

- [ ] environment configuration is documented
- [ ] deployment concerns are separated from MVP design
- [ ] release readiness criteria are defined

## 13. Final Review

- [ ] no contradictions remain across requirement docs
- [ ] roadmap phases remain correctly staged
- [ ] future social and AI features are clearly out of MVP scope
- [ ] project is ready for the next implementation phase

## 14. Phase 3 — Profile / Dashboard

- [x] authenticated profile read/update contract is implemented
- [x] profile migration backfills existing users
- [x] dashboard and profile shell use the authenticated session
- [x] future tracking cards are explicitly unavailable and do not fabricate data
- [x] API and browser tests cover the Phase 3 flows
- [x] validate/apply migration against PostgreSQL and verify the integrated Docker stack
