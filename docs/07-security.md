# Security

## 1. Security Priorities

Because the product stores personal fitness and health information, the application must be treated as handling sensitive data. The system should be designed to minimize exposure and enforce least privilege throughout the stack.

## 2. Secret Management

- secrets must be stored in environment variables
- secrets must never be committed to source control
- example values should be placed in `.env.example` or equivalent non-secret documentation only
- production secrets must be managed through a secure platform or deployment mechanism

## 3. Environment Variables

The system will require environment variables for:

- database connection strings
- Prisma database URL
- API JWT secrets
- refresh token secrets
- app base URLs
- Docker environment values where relevant
- optional external service keys for future integrations

## 4. Password Security

- password hashes must not be stored in plaintext
- server-side hashing is required
- password validation should enforce reasonable minimum requirements without making the system unnecessarily burdensome
- password reset flows, if added later, must use secure recovery patterns

## 5. Authentication Security

- validate all authentication requests server-side
- reject invalid or expired tokens
- prevent token leakage via logs or client-side storage mistakes
- rotate refresh tokens where applicable
- send browser refresh tokens only in HTTP-only cookies
- keep access tokens in memory rather than local or session storage
- store refresh token hashes rather than bearer tokens in the database
- fail application startup when required token secrets are missing, weak, or identical

## 6. Authorization Security

- all protected endpoints must enforce authorization
- ownership checks must occur server-side
- user-supplied IDs must not be treated as authorization proof
- resource access must be checked at the API layer, not only in the UI

## 7. Input Validation

The application must validate user input before processing and persisting data.

This includes:

- required field enforcement
- type validation
- date validation
- range checks for numeric values
- SQL injection prevention through parameterized queries and Prisma usage
- safe handling of untrusted data

## 8. Output Handling

- do not return internal stack traces or sensitive implementation details in client responses
- do not leak private credentials or tokens through API responses
- ensure API errors are clear but not verbose enough to expose internal systems
- protect logs from exposing sensitive payloads

## 9. Database Security

- use PostgreSQL and Prisma as the approved persistence stack
- use parameterized queries and Prisma instead of raw SQL composition from user input
- protect database credentials and restrict database access by least privilege
- avoid broad or unnecessary access rights

## 10. Rate Limiting and Abuse Prevention

The project should consider basic rate limiting and abuse protection for login and sensitive routes where appropriate. This is a design consideration, not a promise of a full enterprise abuse-prevention layer in MVP.

## 11. Logging and Privacy

- do not log passwords, tokens, or secrets
- avoid logging raw request bodies with sensitive user data
- ensure logs are structured and privacy-aware
- redact data in logs when necessary

## 12. Dependency Security

- keep dependencies up to date
- review dependency risk before adding new packages
- avoid unnecessary libraries and duplicate abstractions
- prefer maintained and widely used packages

## 13. Secure Error Handling

Errors must be handled so they help users without exposing internal detail.

Examples:

- validation errors show what is wrong without printing stack traces
- auth failures return standard unauthorized responses
- not-found errors should not reveal internal resource identifiers unnecessarily

## 14. Least Privilege Principles

- use minimal service permissions
- keep database users, CI secrets, and deployment credentials scoped correctly
- ensure local development uses isolated secrets
- avoid broad administrative access in day-to-day operations

## 15. Current Security Assumptions

The project treats health and fitness records as sensitive personal data. Social and AI features remain future scope and should not be implemented until the organization has reviewed the privacy and security implications of those features.

The Phase 2 refresh cookie is `SameSite=Lax`, scoped to `/api/v1/auth`, and marked `Secure` in production. Access tokens are short-lived (15 minutes) and are sent using the Authorization bearer scheme.

Phase 3 profile and dashboard handlers require the access-token guard and derive ownership from its verified subject. Profile update DTOs validate name, height, and weight-unit values; user IDs are not accepted from the browser for these operations.

Phase 4 exercise and workout handlers use the same guard and owner-scoped persistence. Nested workout exercise IDs are verified as owned by the authenticated user, preventing cross-account references. Deleting a workout cascades only to its own entries; exercise references are restricted to preserve history.

Phase 5 water and measurement handlers also require authentication and scope every read, aggregate, update, and delete to the verified user. The API validates dates and numeric ranges before persistence; health records are not shared across accounts.

Phase 6 goal and chart handlers follow the same owner-only rule. Aggregations
are filtered by the verified user ID; client-supplied progress values are not
accepted or trusted. Goal titles and measurement-derived values are treated as
private health-related data and are not logged.

Phase 7 nutrition entries and summaries are sensitive user-owned records.
Every query and mutation is scoped to the authenticated subject, DTOs validate
date, text, and numeric bounds, and summaries exclude other users' records.
Meal descriptions, notes, and nutrient values must not be included in logs.

Phase 8 plans and schedule items are private user-owned records. Nested item
operations must verify the authenticated owner through the plan; workout
linking must verify that the workout has that same owner. Plan deletion must
not delete workout history, and schedule queries must never return another
user's plans or linked workouts.
