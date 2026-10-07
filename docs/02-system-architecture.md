# System Architecture

## 1. System Context

Fitness Tracker V2 is a personal health and fitness platform built for a single-user-first architecture. The product sits between the end user and their health data, combining a web frontend and a modular backend API that persist health-related records in PostgreSQL.

The intended high-level flow is:

```text
Browser / Web Client
        ↓
Next.js Frontend
        ↓
REST API ( /api/v1 )
        ↓
NestJS Modular Backend
        ↓
PostgreSQL
```

The architecture intentionally stays simple during the MVP phase. It avoids unnecessary service decomposition and remains modular by domain rather than by physical service boundary.

## 2. Application Boundaries

### Frontend boundary

- Next.js web application
- React UI components
- Tailwind-based design system and layouts
- client-side form validation and user experience states
- API consumption through typed or structured client patterns

### Backend boundary

- NestJS application
- domain-oriented modules
- REST controllers, services, DTOs, guards, validators, and Prisma integration
- authentication and authorization logic
- business logic and persistence orchestration

### Data boundary

- PostgreSQL as the system of record
- Prisma as the schema and migration layer
- persisted user health records, workouts, goals, and metrics

## 3. Frontend Architecture

The frontend will be a Next.js application using React and TypeScript. The web app is the primary UI client during MVP. It should remain presentation-focused and avoid directly owning business-critical authorization logic.

Expected frontend responsibilities:

- user authentication flows
- dashboard presentation
- workout creation and history views
- goal tracking and summary charts
- nutrition and water logging forms
- nutrition history and recorded-value summaries
- profile management screens
- lightweight plan and schedule management
- responsive layouts and accessibility handling
- error, loading, empty, and validation states

The frontend should not be the source of security authority. Client-side restrictions may improve UX, but authorization must still be enforced by the server.

## 4. Backend Architecture

The backend will be a NestJS application using a modular monolith pattern. Modules should align with business domains and keep the service boundaries readable.

Recommended module boundaries:

- auth
- users
- profiles
- workouts
- exercises
- water
- measurements
- goals
- progress summaries and chart data remain in the relevant domain services
- nutrition
- plans
- scheduled plan items (within the plans domain)
- scheduling

This list is a starting point, not an absolute guarantee. Module boundaries may evolve as the product grows, but changes must be documented.

### Backend responsibilities

- request validation
- authentication and token handling
- authorization checks
- resource ownership enforcement
- domain logic and business rules
- persistence through Prisma
- consistent error responses

### Architectural constraints

- business logic should not live directly in controllers
- controllers should manage transport concerns
- services should own domain behavior
- persistence must be isolated through Prisma access patterns
- external integrations must be kept behind clear interfaces

## 5. Database Architecture

The system uses PostgreSQL as the primary data store. Prisma manages schema generation and migrations.

The database is designed around user-owned records. Every key persisted object should belong to a user or be explicitly shared through a documented mechanism.

Important design principles:

- explicit ownership
- clear foreign-key relationships
- timestamping for auditability
- meaningful indexing for common access patterns
- no premature denormalization
- secure handling of sensitive health data

## 6. REST API Architecture

The application exposes a REST API under `/api/v1`.

Conventions:

- resource-oriented endpoints
- HTTP methods align with CRUD semantics
- consistent JSON responses
- predictable validation, error, pagination, and filtering patterns
- versioning through `/api/v1`

Example resource groups:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/profiles`
- `/api/v1/workouts`
- `/api/v1/exercises`
- `/api/v1/water`
- `/api/v1/measurements`
- `/api/v1/goals`
- `/api/v1/nutrition`
- `/api/v1/plans`

The exact endpoint list will be finalized during API specification work and should remain aligned with the documented requirements.

## 7. Data Flow

### Typical flow for a workout entry

1. User authenticates.
2. Browser sends a request to the Next.js application.
3. The frontend submits a request to `/api/v1/workouts`.
4. NestJS validates the request and verifies authorization.
5. Prisma persists the workout and related records to PostgreSQL.
6. The API returns the created resource or a structured error response.
7. The frontend updates the relevant UI state.

### Typical flow for a chart or dashboard summary

1. User requests dashboard data.
2. Server fetches the relevant user-owned records.
3. Domain services aggregate, summarize, and format the data.
4. API responds with structured payloads for charts and cards.
5. Frontend renders the summary with appropriate loading and empty states.

Phase 6 keeps goal CRUD and progress aggregation in the NestJS modular
monolith. Goal progress reads only owner-scoped water, workout, and measurement
records; the browser renders chart data returned by the API and does not
calculate authoritative progress.

Phase 7 keeps nutrition entry CRUD and range aggregation in its own NestJS
domain module. Nutrient summaries add only values explicitly recorded by the
user; there is no food catalog or derived nutrient calculation.

## 8. Authentication Flow

The application will use a secure authentication flow with server-side enforcement.

Proposed default design:

- user registers with email and password
- server hashes password using a strong password hashing mechanism
- server issues access and refresh tokens
- browser stores tokens in secure cookies or secure client storage pattern for web clients
- protected API routes verify tokens and enforce ownership checks
- refresh flow rotates tokens for better security

This is a conservative default, not a requirement to create every auth mechanism prematurely. It should be documented as the starting design unless a later requirement changes it.

## 9. Deployment Model

The initial deployment model is local or containerized development and CI-based validation. The project includes Docker and Docker Compose for local infrastructure and GitHub Actions for CI.

The architecture is designed so that:

- local development is reproducible
- PostgreSQL is available through Docker
- CI can run linting, type checks, tests, and builds
- production deployment remains a future concern and should not constrain the MVP design

## 10. Future AI / Device Integration Points

The architecture leaves explicit integration seams for future AI or device services.

Potential future boundaries:

- AI recommendation service
- wearable synchronization service
- device import collectors
- analytics or prediction processing pipelines

These services should not be introduced until there is a justified need and a documented requirement.

## 11. Architectural Constraints

- Do not start with a microservice-first architecture.
- Keep modular boundaries tied to business domains.
- Do not collapse the backend into a single undifferentiated application layer.
- Do not expose internal database details or schema design to the frontend.
- Do not accept untrusted IDs as proof of ownership.
- Do not introduce graphQL, gRPC, or event-driven service complexity without a documented requirement.

## 12. Summary

This architecture balances clarity, maintainability, and progressive evolution. The initial scope is a modular monolith built on Next.js, NestJS, PostgreSQL, and Prisma, with REST APIs under `/api/v1`. Later-phase expansion is explicitly reserved for future work that the project can validate with real usage and need.
