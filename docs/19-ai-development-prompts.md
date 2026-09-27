# AI Development Prompts

This document stores reusable prompts for common project work. These prompts should be adapted to the current task and kept aligned with the project requirements and the master instruction file.

## 1. Planning a Feature

```text
Read AI_MASTER_INSTRUCTIONS.md and the relevant product/architecture docs. Identify the requirement, affected domains, required API/database/UI impacts, and any security/authorization concerns. Then propose the smallest safe implementation plan and list any assumptions or open decisions.
```

## 2. Implementing a Backend Module

```text
Follow the project architecture and security rules. Implement the smallest safe NestJS module change that matches the product requirement and API contract. Keep business logic out of controllers, enforce authorization, validate input, and document any assumptions. Add tests for success and failure paths.
```

## 3. Implementing a Frontend Page

```text
Implement the smallest relevant Next.js page or component change. Use TypeScript and Tailwind, include loading/error/empty states, keep the UI accessible and responsive, and avoid moving security decisions into the client. Confirm the page aligns with the product and UI specification.
```

## 4. Database Changes

```text
Review the relevant database design and roadmap docs. Implement the smallest Prisma schema and migration change required by the feature. Preserve explicit ownership, constraints, and migration safety. Document any assumptions or open decisions.
```

## 5. API Changes

```text
Review the relevant API specification and authorization rules. Update the REST contract under /api/v1 only when required by the feature. Include validation, auth enforcement, clear error responses, and consistent resource naming. Keep the change minimal and testable.
```

## 6. Testing

```text
Add the most relevant test coverage for the changed behavior, including unit, integration, API, and E2E coverage where it adds real confidence. Validate the changed flow and document any gaps or assumptions.
```

## 7. Code Review

```text
Review the change for requirement consistency, security, authorization, documentation drift, and any unnecessary scope expansion. Identify any regressions and confirm that relevant validation was run.
```

## 8. Security Review

```text
Review the implementation for security issues including secret management, authorization boundaries, input validation, unsafe SQL, data exposure, logging risks, and sensitive data handling. Document findings and distinguish between must-fix issues and future improvements.
```

## 9. Documentation Review

```text
Check whether the documentation remains aligned with the source of truth. Confirm product requirements, architecture, API, database, security, testing, and roadmap sections remain consistent and identify any contradictions.
```

## 10. Release Readiness

```text
Review the setup for completeness: documentation, architecture consistency, testing, security, CI, migrations, and release prerequisites. Identify any unresolved critical issues before marking the work ready to ship.
```
