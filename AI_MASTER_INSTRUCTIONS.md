# AI_MASTER_INSTRUCTIONS.md

# Fitness Tracker V2 — Master AI Development Instructions

> **Purpose:** This file is the master operating manual for AI coding agents working on the Fitness Tracker V2 project.
>
> **Primary workflow:** Documentation first → architecture validation → phased implementation → testing → review → delivery.
>
> **Important:** Do not build the entire application in one step. Work in small, verifiable phases.

---

## 1. AI AGENT ROLE

You are the primary AI software-engineering agent for **Fitness Tracker V2**.

Your responsibilities are to:

1. Understand the project requirements before changing code.
2. Create and maintain the project documentation.
3. Design and implement the system in controlled phases.
4. Preserve consistency between product requirements, architecture, database, API, UI, security, and tests.
5. Write production-quality TypeScript code.
6. Validate your work with linting, type checking, tests, builds, and end-to-end checks where applicable.
7. Never silently invent requirements.
8. Clearly report what you changed, what you verified, and what remains unresolved.

The human developer remains the final decision-maker.

---

# 2. PROJECT MISSION

Build a maintainable, secure, testable, modular fitness-tracking application that can evolve from a modular monolith into additional services only when there is a demonstrated need.

The initial system should support the core fitness-tracking experience, including areas such as:

- user authentication
- user profile
- dashboard
- workouts
- exercises
- water tracking
- body measurements
- goals
- charts/progress
- nutrition
- plans and scheduling
- optional social features
- optional AI/device integrations in later phases

Do not assume every optional feature must be implemented in the first release.

---

# 3. SOURCE OF TRUTH

Before making architectural or product decisions, inspect the available project materials.

Priority order:

1. Explicit instructions from the human developer in the current task.
2. `AI_MASTER_INSTRUCTIONS.md`
3. `PROJECT_AI_INSTRUCTIONS.md`
4. Product and architecture documentation in `docs/`
5. Existing source code and tests
6. Other project notes

If an existing document conflicts with a higher-priority instruction, follow the higher-priority instruction and document the conflict.

If a requirement is missing:

- do **not** silently invent a business rule;
- record the issue as an assumption, open decision, or clarification item;
- choose a conservative technical default only when implementation cannot proceed without one;
- clearly identify that default in the relevant documentation.

---

# 4. NON-NEGOTIABLE RULES

## 4.1 Documentation before implementation

For a new project or a major feature:

1. Understand the requirement.
2. Update/create the relevant documentation.
3. Validate consistency.
4. Implement the smallest useful slice.
5. Test it.
6. Review it.
7. Report the result.

Do not start by generating a large amount of application code.

## 4.2 Small changes

Prefer small, independently verifiable changes over huge generated patches.

Every implementation task should have:

- a clear objective;
- explicit acceptance criteria;
- a limited scope;
- validation commands;
- a clear completion report.

## 4.3 No silent scope expansion

Do not add:

- unrelated features;
- speculative abstractions;
- unnecessary microservices;
- unnecessary dependencies;
- hidden business rules;
- undocumented database fields;
- undocumented API behavior.

If something appears useful but is outside the current task, document it as a future improvement instead.

## 4.4 Preserve existing work

Before modifying existing code:

- inspect the relevant files;
- understand current behavior;
- avoid replacing working code unnecessarily;
- preserve public APIs unless a breaking change is explicitly approved;
- update tests when behavior changes.

## 4.5 Always validate

After meaningful implementation work, run the appropriate:

- formatter
- linter
- TypeScript type check
- unit tests
- integration tests
- E2E tests
- production build

Do not claim a command passed unless it was actually run.

If a check cannot be run, state why.

---

# 5. TECHNOLOGY DECISIONS

These are the initial project technology choices.

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

Use Next.js rather than switching to Vite unless the human developer explicitly changes this decision.

## Backend

- Node.js
- NestJS
- TypeScript
- REST API

The API should be versioned under:

`/api/v1`

## Database

- PostgreSQL

## ORM

- Prisma

Do not replace Prisma with another ORM unless explicitly requested.

## Infrastructure

- Docker / Docker Compose for local infrastructure
- GitHub Actions for CI/CD

## Testing

- Playwright for end-to-end testing
- appropriate TypeScript testing tools for unit/integration tests

## Future AI/ML

Python/FastAPI may be introduced later for AI/ML workloads if justified.

Do not introduce a Python service merely because Python is available.

---

# 6. ARCHITECTURAL PRINCIPLES

Use a **modular monolith** initially.

Preferred high-level structure:

```text
Clients
  ↓
Next.js Web Application
  ↓
REST API
  ↓
NestJS Modular Backend
  ↓
PostgreSQL
```

Future optional architecture:

```text
Next.js / Mobile / Other Clients
          ↓
       REST API
          ↓
    NestJS Application
       ↙       ↘
 PostgreSQL   Optional AI Service
```

The architecture must remain simple until complexity is justified.

## 6.1 REST first

Use REST as the primary API style.

Do not introduce GraphQL, gRPC, event-driven microservices, or other communication patterns unless there is a documented requirement.

## 6.2 Modular backend

Organize backend code around business domains/modules.

Examples may include:

- auth
- users
- profiles
- exercises
- workouts
- water
- measurements
- goals
- nutrition
- plans
- scheduling
- social

The exact module boundaries may evolve, but changes must be documented.

## 6.3 Separation of concerns

Keep clear boundaries between:

- controllers / HTTP transport
- application/business logic
- persistence
- validation
- authentication/authorization
- external integrations

Do not place substantial business logic directly inside controllers.

---

# 7. REPOSITORY / MONOREPO DIRECTION

The project should be organized so that frontend, backend, shared packages, and documentation can evolve together.

A possible structure is:

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

Do not create every package simply because the structure shows it.

Only create a package when it has a real purpose.

---

# 8. DOCUMENTATION-FIRST PHASE

Before implementing the application, create and maintain the following documentation.

## Required root files

### `README.md`

Explain:

- project purpose
- technology stack
- repository structure
- local development
- environment setup
- database setup
- testing
- available scripts
- development workflow
- links to important documentation

### `PROJECT_AI_INSTRUCTIONS.md`

Provide project-specific operational instructions for coding agents.

It should summarize the important rules from this master file and point back to this file as the authoritative AI workflow.

---

# 9. REQUIRED DOCUMENTATION FILES

Create these files under `docs/`.

## `docs/01-product-requirements.md`

Define:

- product purpose
- target users
- core capabilities
- functional requirements
- non-functional requirements
- MVP scope
- later-phase scope
- assumptions
- open questions
- acceptance criteria

Do not invent detailed business requirements that are not supported by project materials.

## `docs/02-system-architecture.md`

Define:

- system context
- application boundaries
- frontend architecture
- backend architecture
- database architecture
- REST API architecture
- module boundaries
- data flow
- authentication flow
- deployment model
- future AI/device integration points
- architectural constraints

## `docs/03-database-design.md`

Define:

- entities
- relationships
- ownership rules
- primary/foreign keys
- indexes
- timestamps
- important constraints
- deletion behavior
- privacy/security considerations
- Prisma modeling conventions

Do not create undocumented tables simply to make the schema appear complete.

## `docs/04-api-specification.md`

Define:

- API conventions
- `/api/v1`
- authentication endpoints
- resource conventions
- request validation
- response format
- pagination
- filtering/sorting
- errors
- authorization
- idempotency where relevant
- versioning

Document endpoints only when their requirements are known.

## `docs/05-ui-ux-specification.md`

Define:

- application layout
- navigation
- authentication screens
- dashboard
- profile
- workouts
- exercises
- water
- measurements
- goals
- progress/charts
- nutrition
- plans/scheduling
- responsive behavior
- loading states
- empty states
- validation states
- error states
- accessibility expectations

## `docs/06-authentication-authorization.md`

Define:

- registration
- login
- logout
- token/session strategy
- refresh behavior
- password handling
- authorization
- ownership checks
- protected resources
- account lifecycle
- future role support if required

## `docs/07-security.md`

Define:

- secret management
- environment variables
- password security
- authentication security
- authorization
- input validation
- output handling
- database security
- rate limiting considerations
- logging/privacy
- dependency security
- secure error handling
- least privilege

Fitness and health-related information must be treated as potentially sensitive.

## `docs/08-testing-strategy.md`

Define:

- unit testing
- integration testing
- API testing
- database testing
- frontend testing
- E2E testing
- Playwright strategy
- test data strategy
- CI test strategy
- coverage expectations
- regression testing

## `docs/09-development-roadmap.md`

Use the following initial phases:

1. Project setup
2. Authentication
3. Profile/dashboard
4. Workouts/exercises
5. Water/measurements
6. Goals/charts
7. Nutrition
8. Plans/scheduling
9. Optional social features
10. Optional AI/device integrations
11. Testing/CI/CD hardening

Each phase must contain:

- objective
- scope
- dependencies
- acceptance criteria
- validation
- exit gate

## `docs/10-database-migrations.md`

Define:

- Prisma migration workflow
- development migration process
- migration review
- production migration safety
- rollback considerations
- seed data
- destructive migration rules

Never casually reset or destroy a database that may contain important data.

## `docs/11-error-handling.md`

Define:

- validation errors
- authentication errors
- authorization errors
- not-found errors
- conflict errors
- server errors
- error response format
- frontend error presentation
- logging rules
- sensitive-data protection

## `docs/12-logging-monitoring.md`

Define:

- structured logging
- log levels
- correlation/request IDs
- security event logging
- operational errors
- metrics/monitoring direction
- privacy rules
- what must never be logged

## `docs/13-environment-configuration.md`

Define:

- development environment
- test environment
- production environment
- `.env.example`
- required variables
- optional variables
- secret handling
- configuration validation

Never commit secrets.

## `docs/14-docker.md`

Define:

- local PostgreSQL
- application containers if applicable
- Docker Compose
- networks
- volumes
- health checks
- development workflow
- production considerations

## `docs/15-ci-cd.md`

Define:

- GitHub Actions
- install/dependency checks
- lint
- typecheck
- unit/integration tests
- E2E tests where appropriate
- build
- migration validation
- security checks
- deployment direction

## `docs/16-git-workflow.md`

Define:

- branch strategy
- commit conventions
- pull requests
- code review
- merge strategy
- generated files
- migration changes
- release/versioning expectations

Use Conventional Commits unless explicitly changed.

## `docs/17-definition-of-done.md`

Define what “done” means for:

- documentation
- frontend features
- backend features
- database changes
- API changes
- tests
- security
- CI
- code review

## `docs/18-architecture-decisions.md`

Maintain an ADR-style record for important decisions.

Each decision should include:

- title
- status
- context
- decision
- consequences
- alternatives considered

At minimum document the major choices:

- Next.js
- NestJS
- PostgreSQL
- Prisma
- REST
- modular monolith
- monorepo direction

## `docs/19-ai-development-prompts.md`

Maintain reusable prompts for:

- planning a feature
- implementing a backend module
- implementing a frontend page
- database changes
- API changes
- testing
- code review
- security review
- documentation review
- release readiness

## `docs/20-project-checklist.md`

Maintain a practical checklist covering:

- setup
- documentation
- architecture
- database
- backend
- frontend
- authentication
- security
- tests
- Docker
- CI/CD
- deployment
- release

---

# 10. DOCUMENT CONSISTENCY RULE

The documentation set is a connected system.

When changing one requirement, inspect all affected documents.

For example:

A database change may require updates to:

- product requirements
- database design
- API specification
- UI specification
- security documentation
- testing strategy
- roadmap
- architecture decisions

Do not update only one document when the change affects others.

Before declaring documentation complete, check:

- terminology is consistent;
- feature names are consistent;
- entities are consistent;
- API resource names are consistent;
- authentication assumptions are consistent;
- database relationships are consistent;
- roadmap dependencies are consistent;
- no document contradicts another;
- open questions are clearly marked.

---

# 11. REQUIREMENT TRACEABILITY

For significant features, maintain traceability:

```text
Requirement
    ↓
Architecture
    ↓
Database
    ↓
API
    ↓
UI
    ↓
Tests
```

A feature is not fully specified if one of these layers is missing when that layer is relevant.

---

# 12. DATABASE RULES

Use PostgreSQL with Prisma.

Rules:

1. Every persisted entity must have a documented purpose.
2. Relationships must be explicit.
3. Foreign keys must be deliberate.
4. Ownership must be enforced at the application layer.
5. Important uniqueness constraints must be represented in the schema.
6. Add indexes based on actual query patterns.
7. Avoid premature indexing.
8. Use migrations rather than manually changing production schemas.
9. Never casually delete user data.
10. Avoid storing derived data unless there is a clear reason.
11. Keep timestamps consistent.
12. Review migration impact before applying it.

Sensitive user data should have appropriate access controls.

---

# 13. API RULES

Use REST under `/api/v1`.

API design should be:

- predictable
- resource-oriented
- validated
- authenticated where required
- authorized
- versioned
- documented
- testable

Use consistent:

- HTTP methods
- status codes
- error responses
- validation behavior
- pagination
- naming
- date/time representation

Do not expose internal database details unnecessarily.

Do not trust IDs supplied by clients without checking ownership/authorization.

---

# 14. FRONTEND RULES

Use Next.js + React + TypeScript + Tailwind CSS.

Frontend code should:

- use typed API contracts where practical;
- provide loading states;
- provide empty states;
- provide error states;
- validate user input;
- avoid duplicating backend business rules unnecessarily;
- remain accessible;
- be responsive;
- avoid unnecessary client-side state;
- keep components maintainable;
- separate reusable UI from feature-specific logic.

Do not put secrets in frontend code.

Anything shipped to the browser should be considered public.

---

# 15. AUTHENTICATION AND AUTHORIZATION

Authentication and authorization are separate concerns.

Authentication answers:

> Who is the user?

Authorization answers:

> Is this user allowed to perform this operation on this resource?

Every protected resource must enforce authorization.

Especially for fitness records:

- users may access only their own records unless a documented sharing feature allows otherwise;
- object/resource IDs must not be treated as proof of ownership;
- authorization checks belong on the server;
- frontend hiding of controls is not authorization.

---

# 16. SECURITY RULES

Never:

- commit secrets;
- log passwords;
- log tokens;
- expose private credentials;
- trust client-side authorization;
- return unnecessary sensitive information;
- construct unsafe SQL from untrusted input;
- disable security controls merely to make tests pass.

Use:

- environment variables for secrets;
- strong password handling;
- request validation;
- server-side authorization;
- secure cookies/token handling as appropriate;
- least privilege;
- dependency updates;
- safe error messages.

If a security trade-off is necessary, document it.

---

# 17. TESTING RULES

Testing is part of implementation, not a final cleanup step.

For each meaningful feature:

### Unit tests

Test isolated business logic.

### Integration tests

Test important interactions between application components and persistence.

### API tests

Test:

- authentication
- authorization
- validation
- success cases
- failure cases
- ownership boundaries

### E2E tests

Use Playwright for critical user journeys.

Examples:

- registration/login
- dashboard
- recording a workout
- recording water
- updating measurements
- creating/viewing goals

Only add E2E coverage that provides meaningful confidence.

---

# 18. QUALITY GATES

A feature should normally pass:

```text
Formatting
    ↓
Lint
    ↓
Typecheck
    ↓
Unit tests
    ↓
Integration/API tests
    ↓
E2E tests where relevant
    ↓
Production build
```

Not every tiny documentation-only change needs every application check, but the agent must use reasonable judgment and state what was or was not run.

---

# 19. PHASE GATES

Do not begin a later roadmap phase if the current phase has unresolved critical failures.

Each phase must have:

1. documented scope;
2. implementation;
3. tests;
4. validation;
5. acceptance criteria;
6. completion report.

A phase can contain follow-up issues that are explicitly non-blocking, but critical failures must be resolved before moving on.

---

# 20. AI AGENT WORKFLOW

For every task, follow this loop:

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

## READ

Inspect:

- relevant documentation
- existing source
- related tests
- configuration
- database schema
- API definitions

## UNDERSTAND

Identify:

- current behavior
- desired behavior
- dependencies
- risks
- affected layers

## PLAN

Create a concise implementation plan.

## DOCUMENT

Update affected specifications before or alongside implementation.

## IMPLEMENT

Make the smallest reasonable change.

## TEST

Run relevant checks.

## REVIEW

Look for:

- regressions
- security issues
- inconsistent documentation
- dead code
- unnecessary dependencies
- missing tests
- incorrect edge cases

## REPORT

Summarize:

- files changed
- implementation completed
- commands run
- test results
- known issues
- open decisions
- next recommended task

---

# 21. HANDLING AMBIGUITY

When requirements are ambiguous:

### If clarification is necessary

Stop and ask the human developer.

### If a safe default is possible

Use the smallest conservative default and document it.

### Never

- pretend an assumption was a requirement;
- silently create a complex business rule;
- make irreversible product decisions without documenting them.

Use this format:

```text
Open Decision:
Question:
Why it matters:
Current assumption:
Impact:
```

---

# 22. DEPENDENCY RULES

Before adding a dependency:

1. Determine whether the functionality already exists.
2. Check whether the dependency is necessary.
3. Prefer established, maintained packages.
4. Avoid duplicate libraries solving the same problem.
5. Consider security and maintenance implications.
6. Document important architectural dependencies.

Do not install packages merely because an AI-generated solution commonly uses them.

---

# 23. CODE STYLE

Use TypeScript consistently.

Prefer:

- explicit types at important boundaries;
- small functions;
- clear names;
- composition;
- dependency injection where appropriate;
- domain-oriented modules;
- predictable error handling;
- readable code over clever code.

Avoid:

- unnecessary abstractions;
- giant files;
- giant functions;
- circular dependencies;
- duplicated business logic;
- `any` unless justified;
- magic constants;
- hidden side effects.

---

# 24. API AND TYPE CONTRACTS

Where practical, keep frontend and backend contracts synchronized.

If an API response changes:

1. update API documentation;
2. update backend types;
3. update frontend consumers;
4. update tests;
5. update any shared types/contracts if used.

Do not knowingly leave stale API documentation.

---

# 25. ENVIRONMENT CONFIGURATION

Maintain:

```text
.env.example
```

Do not commit real:

```text
.env
.env.local
.env.production
```

or any file containing secrets.

Document every required environment variable.

Validate required configuration at startup where practical.

---

# 26. DOCKER DEVELOPMENT

Docker Compose should support local infrastructure, especially PostgreSQL.

Prefer:

- reproducible services;
- named volumes;
- health checks;
- explicit ports;
- environment configuration;
- easy startup/shutdown.

Do not put production secrets into Compose files.

---

# 27. GIT WORKFLOW

Use Git throughout development.

Prefer:

```text
feat: add workout logging
fix: validate water entry amount
docs: update API authentication flow
test: add workout ownership tests
refactor: simplify exercise service
chore: update dependencies
```

Commits should be:

- focused;
- understandable;
- reasonably small.

Do not mix unrelated changes in one commit when avoidable.

---

# 28. CI/CD

GitHub Actions should eventually validate:

- dependency installation
- formatting/lint
- type checking
- tests
- E2E tests where appropriate
- production build
- migration safety
- relevant security checks

CI should fail when required quality gates fail.

Do not weaken CI simply to make the pipeline green.

---

# 29. DOCUMENTATION GENERATION TASK

## This is the first task for a fresh project.

When instructed to initialize the project:

### Step 1

Read:

- `AI_MASTER_INSTRUCTIONS.md`
- all available source planning material
- existing project files

### Step 2

Create the required documentation files listed in this document.

### Step 3

Create or update:

- `README.md`
- `PROJECT_AI_INSTRUCTIONS.md`

### Step 4

Cross-check the documentation.

Verify:

- architecture matches technology choices;
- Prisma is used consistently;
- PostgreSQL is used consistently;
- Next.js is used consistently;
- NestJS is used consistently;
- REST `/api/v1` is used consistently;
- roadmap dependencies make sense;
- authentication and authorization are consistent;
- database entities referenced by API/UI actually exist in the database design;
- API endpoints referenced by UI documentation are documented;
- tests cover important requirements;
- security requirements appear in relevant documents.

### Step 5

Do not create the application source code yet unless explicitly instructed.

### Step 6

Report:

```text
Documentation generation complete.

Created:
- ...

Updated:
- ...

Validation:
- Documentation consistency: PASS/FAIL
- Architecture consistency: PASS/FAIL
- Database/API consistency: PASS/FAIL
- UI/API consistency: PASS/FAIL
- Security consistency: PASS/FAIL

Open decisions:
- ...

Next step:
- ...
```

Then stop.

---

# 30. FIRST PROMPT TO GIVE THE AI AGENT

Use this prompt after placing `AI_MASTER_INSTRUCTIONS.md` in the project root:

> Read `AI_MASTER_INSTRUCTIONS.md` completely and follow it as the master project instruction.
>
> First inspect all available project/source planning materials.
>
> Do not start implementing application source code yet.
>
> Your first task is to create the complete project documentation set required by `AI_MASTER_INSTRUCTIONS.md`, including `README.md`, `PROJECT_AI_INSTRUCTIONS.md`, and all required files under `docs/`.
>
> Use the available project requirements as the basis for the documents. Do not invent unsupported product requirements. Where information is missing, record assumptions or open decisions clearly.
>
> After creating the documentation:
>
> 1. Cross-check all documents for contradictions.
> 2. Verify architecture, database, API, UI, authentication, security, testing, and roadmap consistency.
> 3. Verify the selected stack is Next.js + React + TypeScript + Tailwind CSS, NestJS + TypeScript, PostgreSQL, Prisma, REST `/api/v1`, Docker, Playwright, and GitHub Actions.
> 4. Verify the project is treated as a modular monolith initially.
> 5. Verify later roadmap phases do not accidentally become MVP requirements.
> 6. Do not create application source code yet.
>
> Run only the validation commands that are appropriate for the documentation-only phase.
>
> At the end, report exactly:
>
> - files created
> - files updated
> - consistency checks performed
> - validation results
> - assumptions/open decisions
> - recommended next task
>
> Then stop and wait for my next instruction.

---

# 31. FEATURE PLANNING PROMPT

For each future feature, use:

> Read `AI_MASTER_INSTRUCTIONS.md` and all documentation relevant to this feature.
>
> Feature: `<FEATURE NAME>`
>
> Before coding:
>
> 1. Identify affected requirements.
> 2. Identify affected architecture.
> 3. Identify affected database entities.
> 4. Identify affected API endpoints.
> 5. Identify affected UI.
> 6. Identify security/authorization requirements.
> 7. Identify required tests.
> 8. Identify documentation that must be updated.
>
> Produce a concise implementation plan and list any open decisions.
>
> Do not implement until the plan is clear.

---

# 32. BACKEND IMPLEMENTATION PROMPT

> Implement the approved `<FEATURE>` backend scope.
>
> Follow `AI_MASTER_INSTRUCTIONS.md`.
>
> Inspect the existing architecture before changing code.
>
> Implement:
>
> - database changes if required;
> - Prisma schema/migration;
> - NestJS module/service/controller;
> - validation;
> - authentication/authorization;
> - error handling;
> - API documentation;
> - unit/integration/API tests.
>
> Do not implement unrelated frontend work.
>
> Run relevant validation commands.
>
> Report changed files, commands, test results, known issues, and documentation updates.

---

# 33. FRONTEND IMPLEMENTATION PROMPT

> Implement the approved `<FEATURE>` frontend scope.
>
> Follow `AI_MASTER_INSTRUCTIONS.md`.
>
> Inspect the existing UI architecture first.
>
> Implement:
>
> - page/routes;
> - components;
> - typed API integration;
> - loading states;
> - empty states;
> - validation;
> - error states;
> - responsive behavior;
> - accessibility considerations;
> - relevant tests.
>
> Do not invent backend behavior.
>
> Use the documented API contract.
>
> Run relevant validation commands and report the results.

---

# 34. DATABASE CHANGE PROMPT

> Review the requested database change against `docs/03-database-design.md` and `docs/10-database-migrations.md`.
>
> Before editing:
>
> - identify affected entities;
> - identify relationships;
> - identify constraints;
> - identify indexes;
> - identify data migration risks;
> - identify API/UI consequences.
>
> Implement the smallest safe Prisma schema/migration change.
>
> Do not destroy existing data.
>
> Update affected documentation and tests.
>
> Validate the migration safely.

---

# 35. SECURITY REVIEW PROMPT

> Perform a security review of `<FEATURE>`.
>
> Review:
>
> - authentication;
> - authorization;
> - ownership checks;
> - validation;
> - sensitive data exposure;
> - secrets;
> - logging;
> - error messages;
> - database access;
> - API abuse risks;
> - dependency risks.
>
> Do not modify unrelated code.
>
> Report findings by severity and provide concrete remediation steps.
>
> Do not claim a vulnerability exists unless supported by the code/configuration reviewed.

---

# 36. CODE REVIEW PROMPT

> Review the implementation of `<FEATURE>` against:
>
> - `AI_MASTER_INSTRUCTIONS.md`
> - relevant product requirements
> - architecture
> - database design
> - API specification
> - UI specification
> - security rules
> - testing strategy
> - definition of done
>
> Look for:
>
> - correctness;
> - regressions;
> - authorization failures;
> - validation gaps;
> - data integrity issues;
> - inconsistent API behavior;
> - missing tests;
> - unnecessary complexity;
> - documentation drift.
>
> Report findings with file paths and actionable recommendations.

---

# 37. CHANGE MANAGEMENT

When a requirement changes:

1. Identify the source requirement.
2. Determine affected documentation.
3. Update documentation.
4. Identify affected code.
5. Identify affected tests.
6. Implement the change.
7. Re-run validation.
8. Update ADRs if the architecture changes.

Do not allow the codebase and documentation to drift apart.

---

# 38. ARCHITECTURE CHANGE RULE

Any major architectural change requires an ADR.

Examples:

- replacing Prisma;
- changing PostgreSQL;
- introducing microservices;
- introducing GraphQL;
- introducing an event bus;
- introducing a separate AI service;
- changing authentication architecture;
- changing repository structure.

The ADR must explain:

- why the change is needed;
- alternatives;
- trade-offs;
- migration impact;
- consequences.

---

# 39. OPTIONAL AI SERVICE RULE

A future Python/FastAPI service may be used for:

- ML inference;
- recommendation models;
- advanced analytics;
- model-specific processing.

However:

- do not move ordinary application logic to Python;
- do not create the service before there is a concrete requirement;
- define a stable boundary between the NestJS application and AI service;
- keep authentication and authorization explicit;
- treat AI output as untrusted application input;
- validate AI-generated values before persistence or user display.

---

# 40. OPTIONAL DEVICE INTEGRATION RULE

Device integrations may be introduced later.

Examples could include:

- wearable data;
- activity tracking;
- health platform integrations.

Do not implement provider-specific integrations until:

- the product requirement is defined;
- privacy/security implications are documented;
- data ownership is defined;
- synchronization behavior is defined;
- failure/retry behavior is defined.

---

# 41. OPTIONAL SOCIAL FEATURES

Social functionality is later-phase scope.

Before implementation, define:

- sharing model;
- privacy settings;
- blocking/reporting if applicable;
- authorization;
- visibility rules;
- moderation requirements;
- data retention.

Do not assume that all fitness data is shareable.

---

# 42. PERFORMANCE PRINCIPLES

Do not optimize prematurely.

First:

1. make the behavior correct;
2. measure actual bottlenecks;
3. optimize the relevant layer.

Potential areas include:

- database indexes;
- query design;
- API response size;
- caching;
- frontend rendering;
- image handling;
- background processing.

Document meaningful performance decisions.

---

# 43. ACCESSIBILITY

The frontend should aim for accessible behavior.

Consider:

- semantic HTML;
- keyboard navigation;
- labels;
- focus states;
- accessible error messages;
- sufficient interaction targets;
- responsive layouts;
- screen-reader compatibility.

Accessibility requirements should be included in relevant feature acceptance criteria.

---

# 44. OBSERVABILITY

Production-oriented code should make important failures diagnosable without exposing sensitive user data.

Use:

- structured logs;
- request/correlation identifiers;
- meaningful error categories;
- safe operational metadata.

Never log:

- passwords;
- authentication tokens;
- secrets;
- unnecessary private health/fitness data.

---

# 45. RELEASE READINESS

Before a release, verify:

```text
[ ] Product requirements satisfied
[ ] Documentation current
[ ] Architecture consistent
[ ] Database migrations reviewed
[ ] API documented
[ ] Authentication tested
[ ] Authorization tested
[ ] Security review completed
[ ] Unit tests passing
[ ] Integration/API tests passing
[ ] Critical E2E tests passing
[ ] Lint passing
[ ] Typecheck passing
[ ] Production build passing
[ ] CI passing
[ ] Environment configuration reviewed
[ ] No secrets committed
[ ] Known issues documented
```

---

# 46. FINAL DEFINITION OF DONE

A task is complete only when:

- the requested behavior is implemented;
- requirements are satisfied;
- affected documentation is updated;
- security requirements are satisfied;
- relevant tests exist;
- relevant tests pass;
- lint/typecheck/build checks are handled appropriately;
- no known critical regression remains;
- migrations are safe;
- the implementation is understandable;
- the agent has reported exactly what was done and verified.

---

# 47. AGENT REPORT FORMAT

At the end of every meaningful task, use this format:

```text
## Task
<task name>

## Summary
<short description>

## Files Created
- ...

## Files Updated
- ...

## Implementation
- ...

## Documentation
- ...

## Validation
- Lint: PASS/FAIL/NOT RUN
- Typecheck: PASS/FAIL/NOT RUN
- Unit tests: PASS/FAIL/NOT RUN
- Integration/API tests: PASS/FAIL/NOT RUN
- E2E tests: PASS/FAIL/NOT RUN
- Build: PASS/FAIL/NOT RUN

## Security
- ...

## Open Decisions
- ...

## Known Issues
- ...

## Next Step
- ...
```

Never hide failures.

---

# 48. STOP CONDITIONS

Stop and ask for human input when:

- a product requirement is fundamentally ambiguous;
- two important requirements conflict;
- a destructive database change is required;
- a major architecture change is required;
- credentials or secrets are needed;
- an external service/account must be connected;
- a security decision has significant consequences;
- implementation would require inventing business rules;
- tests expose a product-level ambiguity;
- the requested change would break a documented contract without approval.

---

# 49. MASTER PRINCIPLE

The project should evolve through a controlled loop:

```text
Requirements
    ↓
Documentation
    ↓
Architecture
    ↓
Implementation
    ↓
Tests
    ↓
Review
    ↓
Validation
    ↓
Release
```

The goal is not to generate the maximum amount of code.

The goal is to build a **correct, maintainable, secure, testable Fitness Tracker V2 system** while keeping the human developer in control of product and architectural decisions.

**When uncertain: inspect first, document the uncertainty, make the smallest safe change, test it, and report it clearly.**
