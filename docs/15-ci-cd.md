# CI / CD

## 1. Purpose

The project uses GitHub Actions to automate validation, quality gates, and release readiness checks. The goal is to catch configuration, code, and workflow regressions early and consistently.

## 2. Workflow Expectations

The CI pipeline should include checks for:

- dependency installation
- linting
- TypeScript type checking
- unit tests
- integration and API tests
- Playwright E2E tests where appropriate
- application build
- Prisma migration validation
- security checks

## 3. Required Validation Steps

At a minimum, the project should run:

- dependency install step
- lint step
- typecheck step
- relevant test suite step
- build step
- migration validation checks where database changes are involved

## 4. Security Checks

The CI pipeline should support basic security validation, including dependency review and scanning where practical. The project should also ensure that environment variables and secrets are not mistakenly committed.

## 5. Testing Execution

The CI system should run relevant tests on code changes and provide a clean failure signal when critical validation has not passed.

## 6. Deployment Direction

The project is not required to define a full production deployment pipeline in the initial documentation, but CI/CD should be designed with future deployment in mind. The project should keep a clear separation between local development validation and production deployment concerns.

## 7. Quality Gate Principles

- no merge should be accepted when critical lint or test failures are present
- database migrations should be reviewed before merge
- E2E checks should be used only where they add meaningful confidence
- future deployment automation should be introduced only when there is clear project need

## 8. Current Assumptions

This project is in the documentation-first phase, so the exact GitHub Actions workflow files are not yet created. The requirement is to document the expected CI direction and the validation responsibilities without inventing unnecessary deployment complexity.
