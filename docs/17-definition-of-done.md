# Definition of Done

## 1. Documentation Done

A feature or phase is considered documented when:

- the requirement is understood and recorded
- affected architecture documentation is reviewed
- API or schema impact is identified when relevant
- open questions are clearly labeled
- related docs remain internally consistent

## 2. Frontend Feature Done

A frontend feature is done when:

- it follows the product and UI specification
- it includes necessary validation and loading states
- it handles empty and error states
- it is accessible and responsive
- it is validated with relevant tests

## 3. Backend Feature Done

A backend feature is done when:

- it matches the documented API contract
- it enforces authorization
- it validates inputs
- it persists or retrieves data through the approved data layer
- it handles errors consistently

## 4. Database Change Done

A database change is done when:

- the migration or schema change is documented
- the change aligns with product and architecture requirements
- relationships and constraints are explicit
- migration safety and rollback considerations are reviewed
- relevant tests or validation checks are run

## 5. API Change Done

An API change is done when:

- the route is under `/api/v1`
- the change is documented in the API specification
- authorization and validation are in place
- response shapes are consistent with the API conventions
- tests cover success and failure cases

## 6. Test Done

A feature is not done without relevant validation.

This includes:

- unit tests for isolated logic
- integration tests for affected behavior
- API tests for auth, validation, and ownership boundaries
- E2E tests for critical user journeys where appropriate

## 7. Security Done

Security is part of completion. A feature is not done if it leaves:

- poor auth or authorization enforcement
- unvalidated user input
- secret leakage risk
- unsafe database access patterns
- insufficient privacy handling for user health data

## 8. CI Done

A feature is done when key CI checks pass for the touched functionality, including linting, type checking, relevant tests, and build validation where appropriate.

## 9. Code Review Done

Code review is complete when:

- the change is understandable and scoped
- risks are identified and mitigated
- documentation was updated if necessary
- required tests and validation were performed

## 10. Final Completion Standard

The applicable phase is complete only when the work meets the documented requirements, passes the relevant quality gates, and does not introduce contradictions across the project documentation.
