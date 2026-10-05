# Product Requirements

## 1. Product Purpose

Fitness Tracker V2 is a secure, maintainable fitness-tracking application for everyday users who want to monitor physical activity, health trends, personal goals, and progress over time. The product is designed to support a strong foundation for personal health tracking while keeping the architecture simple and extensible.

The project is intended to start as a modular monolith and remain easy to evolve without prematurely decomposing into separate services.

## 2. Target Users

Primary users:

- individuals tracking workouts, water intake, and progress
- users who want a clear dashboard of recent fitness activity
- users who need a structured way to set measurable fitness goals
- users who prefer a secure personal health tracking tool

Secondary users / future expansion:

- trainers or coaches using shared plans or scheduling features
- users sharing optional social activity in later phases
- consumers of AI-assisted fitness recommendations in future phases

## 3. Core Capabilities

The product must support the following core capabilities in a phased, MVP-first manner:

- user registration and secure authentication
- user profile management
- dashboard view of recent activity and progress summary
- creation and tracking of workouts and exercise logs
- intake tracking for water
- body measurement tracking over time
- goal creation and progress comparison
- progress charts and historical trend visualization
- nutrition logging and simple dietary tracking
- plans and schedule management for training routines

The following capabilities are expressly future-phase or optional, not MVP requirements:

- social features
- AI recommendations
- device integrations
- coach-facing collaboration features
- automated external data ingestion

## 4. Functional Requirements

### 4.1 Authentication and Account Management

- Users can register with an email and password.
- Users can log in and log out securely.
- Users can view and update their own profile data.
- Users can manage account lifecycle status in compliance with the documented auth/security rules.

### 4.2 Dashboard and Progress

- Users can view a dashboard summarizing recent workout activity, water tracking, goals, and other relevant personal metrics.
- Users can see a high-level overview of progress toward selected goals.
- Users can access recent history and trend summaries.

### 4.3 Workouts and Exercises

- Users can create exercises and manage exercise metadata.
- Users can log workouts with associated date, duration, and notes.
- Users can associate exercises with workouts and record sets, repetitions, or effort where suitable.
- Users can review workout history.

### 4.4 Water and Measurements

- Users can log daily water intake.
- Users can capture body measurements at intervals.
- Users can compare current measurements with prior values.

### 4.5 Goals and Charts

- Users can create goals with target values and dates.
- Users can track progress toward goals.
- Users can review charts or summarized progress data.

Phase 6 initial scope is limited to daily water intake, workouts per calendar
week, and target body weight. Current values are derived from the user's water,
workout, and measurement records; goal progress is not manually entered.
Progress charts show existing water, workout, and weight history only.

### 4.6 Nutrition

- Users can log nutrition entries or meals with contextual data.
- Users can track dietary patterns relevant to fitness goals.
- Users can maintain a record of consumed items without becoming a full nutrition-science platform.

### 4.7 Plans and Scheduling

- Users can define training plans or routine schedules.
- Users can assign workouts to planned dates or time windows.
- Users can view upcoming or completed scheduled activities.

## 5. Non-Functional Requirements

- The application must be secure and protect user health data.
- The system must use the approved stack: Next.js, React, TypeScript, Tailwind CSS, NestJS, PostgreSQL, Prisma, REST under `/api/v1`, Docker, Playwright, GitHub Actions.
- The project must support clear modular boundaries by business domain.
- The system must be testable with unit, integration, API, and E2E coverage where relevant.
- The application must be accessible and responsive.
- The project must follow a documentation-first workflow.
- The project must remain simple and deliberate until there is evidence that additional complexity is justified.

## 6. MVP Scope

The MVP includes:

- authentication
- profile management
- dashboard
- workouts and exercises
- water tracking
- measurements
- goals and charts
- nutrition logging
- plans and scheduling

Everything beyond the listed MVP scope remains explicitly out of scope for the initial release.

## 7. Later-Phase Scope

The following items are deferred until later phases and are not required MVP functionality:

- social features
- community sharing or friend systems
- AI-generated workout or nutrition recommendations
- wearable or device integrations
- external coach collaboration workflows
- advanced analytics or prediction systems

## 8. Assumptions and Open Decisions

Open Decision:
Question: Should user data always be private and single-user by default?
Why it matters: Sharing adds authorization and privacy complexity.
Current assumption: Yes. User records are private by default unless a documented sharing feature is introduced in a later phase.
Impact: The authorization model remains owner-only until an explicit sharing feature is required.

Open Decision:
Question: What level of nutrition tracking is required for MVP?
Why it matters: Nutrition can expand into a full journaling and macro-calculation product.
Current assumption: Keep nutrition logging simple and generic, without introducing advanced diet science or external food database requirements in MVP.
Impact: Nutrition features are limited to basic logging and tracking patterns.

Open Decision:
Question: What exact plan scheduling model is needed?
Why it matters: Scheduling can become highly complex.
Current assumption: Use a lightweight plan and date-based scheduling model for routine tracking rather than a full calendar or team scheduling system.
Impact: Plans remain simple and user-centric.

## 9. Acceptance Criteria

### 9.1 Authentication

- A user can register and log in with a valid email and password.
- The system rejects invalid credentials with a clear error response.
- Protected endpoints are not accessible without authentication.

### 9.2 Profile and Dashboard

- A logged-in user can view and update their profile.
- A dashboard shows the user’s important activities and progress summary.

### 9.3 Fitness Tracking

- A user can log workouts and exercises with relevant metadata.
- A user can log water intake and measurement entries.
- A user can create and track goals.

### 9.4 Nutrition and Plans

- A user can create nutrition entries and view them in context.
- A user can define simple training plans and schedule activities.

### 9.5 Security and Validation

- Sensitive user data is protected by server-side authorization.
- Inputs are validated before persistence.
- The application does not expose private credentials or internal error details to clients.

## 10. Documentation and Scope Constraints

This document intentionally does not define detailed business rules beyond what is necessary to support MVP planning. Future expansion is documented as future scope, not as a current requirement.

Phase 6 implementation assumptions:

- Daily water progress uses the current UTC calendar day's water total.
- Weekly workout progress uses the current UTC Monday-to-Sunday week.
- A target-weight goal captures the latest recorded weight at goal creation as
  its baseline. The target direction is inferred by comparing the target with
  that baseline; creating a target equal to the baseline is rejected.
- Goal completion and overdue state are derived from current progress and the
  optional target date; no manual progress values or user-selected statuses are
  stored.
- Charts use persisted records only. Missing water/workout records are not
  silently presented as confirmed zero activity.
