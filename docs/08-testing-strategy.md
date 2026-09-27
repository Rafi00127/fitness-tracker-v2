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

The project is still documentation-first and no source code has been created yet. The exact unit, integration, and E2E suite will be introduced during implementation in a phased and minimal way that matches the MVP and roadmap requirements.
