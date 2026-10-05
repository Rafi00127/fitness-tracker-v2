# Database Design

## 1. Database Architecture Overview

The project uses PostgreSQL as the system of record and Prisma as the ORM and migration tool. The schema should reflect real user-owned fitness data and clear authorization boundaries.

The database design intentionally favors clarity and explicit ownership over speculative complexity. Health and fitness records are treated as sensitive personal data.

## 2. Core Design Principles

- Every persisted entity must have a clear product purpose.
- Ownership should be explicit and enforced by the application layer.
- Foreign keys should be clear and deliberate.
- Unique constraints should represent actual business rules.
- Common query paths should have indexes.
- Historical records should preserve timestamps.
- Sensitive data should be minimized and protected.

## 3. Conceptual Entity Model

### User

Purpose: authenticates and owns personal data.

Likely fields:

- id
- email
- passwordHash
- createdAt
- updatedAt
- lastLoginAt (optional)
- isActive / isDeleted (depending on lifecycle design)

Rules:

- email should be unique
- password should never be stored in plain text
- user records must not be shared without an explicit feature design

### Profile

Purpose: keeps the signed-in user's basic profile metadata and tracking preference.

Phase 3 implementation:

- `userId` is the primary key and a cascading foreign key to `User`, enforcing one profile per user.
- `heightCm` is nullable `DECIMAL(5,2)`.
- `weightUnit` is the `KG` / `LB` enum and defaults to `KG`.
- `createdAt` and `updatedAt` are maintained by the database/Prisma model.
- The display name is stored as nullable `User.name`, not duplicated in `Profile`.
- The profile migration backfills a profile row for every existing user.

Likely fields:

- userId
- heightCm (optional)
- weightUnit / preferred metrics settings
- createdAt
- updatedAt

Rules:

- one profile per user
- profile belongs to the user who owns it
- Phase 3 does not persist date of birth, bio, avatar, or other unrequested details.

### Exercise

Purpose: stores reusable exercise definitions.

Phase 4 implementation:

- id (cuid primary key)
- userId
- name
- category (optional free-text label)
- notes (optional)
- createdAt
- updatedAt

Rules:

- exercises are private and owned by one user
- names are trimmed and required; duplicate names are allowed because no uniqueness rule is specified
- deleting an exercise referenced by a workout entry is restricted so workout history is preserved

### Workout

Purpose: records a workout session.

Phase 4 implementation:

- id (cuid primary key)
- userId
- title
- date
- durationMinutes (optional)
- notes (optional)
- createdAt
- updatedAt

Rules:

- workouts belong to one user
- workout date is stored as a timestamp; timestamps use UTC at the API boundary
- deleting a workout cascades to its workout exercise entries

### WorkoutExercise

Purpose: maps exercises to workout sessions and records session details.

Phase 4 implementation:

- id (cuid primary key)
- workoutId
- exerciseId
- sets (optional)
- reps (optional)
- weight (optional decimal)
- durationSeconds (optional)
- notes (optional)
- createdAt
- updatedAt

Rules:

- each entry links one workout and one exercise
- the API verifies that both records belong to the authenticated user before linking them
- deleting a referenced exercise is restricted to retain historical workout details

### WaterEntry

Purpose: stores the user's daily fluid intake total.

Phase 5 implementation:

- `id` (cuid primary key), `userId`, calendar `date`, `amountMl`, optional `notes`, `createdAt`, and `updatedAt`
- `date` is a date-only value; the API uses `YYYY-MM-DD`
- intake is stored as a positive integer number of milliliters

Rules:

- one daily total per user and date; update that record instead of creating a second daily record
- water data is private and owner-scoped
- range summaries are calculated from the persisted daily totals

### Measurement

Purpose: records body measurements over time.

Phase 5 implementation:

- `id` (cuid primary key), `userId`, calendar `date`, optional `weightKg`, `waistCm`, `chestCm`, `hipCm`, `bicepsCm`, `bodyFatPercent`, optional `notes`, `createdAt`, and `updatedAt`
- weight is stored canonically in kilograms; length values in centimeters
- weight uses three decimal places to reduce unit-conversion drift; other values use two decimal places, and body-fat percentage is from 0 through 100

Rules:

- measurement values should be nullable where not always applicable
- historical tracking should be preserved
- a snapshot must contain at least one measurement value; multiple snapshots on one date are allowed
- records are private and owner-scoped

### Goal

Purpose: stores target-based personal progress goals.

Likely fields:

- id
- userId
- title
- description
- category
- targetValue
- currentValue
- targetDate
- status
- createdAt
- updatedAt

Rules:

- goals belong to one user
- status should be validated

### NutritionEntry

Purpose: stores basic nutrition tracking data.

Likely fields:

- id
- userId
- date
- mealType
- calories
- proteinGrams
- carbsGrams
- fatsGrams
- notes
- createdAt
- updatedAt

Rules:

- values should be nullable or optional based on the actual design
- nutrition tracking is intentionally kept simple in MVP

### Plan

Purpose: stores user-defined training plans or routine outlines.

Likely fields:

- id
- userId
- name
- description
- startDate
- endDate
- createdAt
- updatedAt

### PlanItem

Purpose: stores workouts or scheduled blocks within a plan.

Likely fields:

- id
- planId
- workoutId (optional)
- scheduledDate
- note
- createdAt
- updatedAt

Rules:

- plan item must belong to a valid plan
- training plan functionality remains intentionally lightweight in MVP

## 4. Relationships

The conceptual relationship model is:

- User has one Profile
- User has many Exercises
- User has many Workouts
- Workout has many WorkoutExercise records
- Exercise can be used in many WorkoutExercise records
- User has many WaterEntry records
- User has many Measurement records
- User has many Goal records
- User has many NutritionEntry records
- User has many Plan records
- Plan has many PlanItem records

## 5. Ownership and Authorization Rules

- User records are private by default.
- Every entity with a userId must be protected by owner checks on server routes.
- Resource IDs alone are not sufficient proof of ownership.
- Shared access is explicitly out of scope until a future requirement introduces it.

## 6. Important Constraints

Recommended constraints:

- unique email on User
- unique user/profile relationship (one profile per user)
- foreign keys for all user-owned child records
- status validation for goals and other enumerated states
- date-based uniqueness where appropriate for repeated daily logs
- check constraints for positive numeric values where appropriate

## 7. Indexing Guidance

Add indexes where practical for common queries, such as:

- users.email
- profile.userId
- workouts.userId + date
- workoutExercise.workoutId
- waterEntry.userId + date
- measurement.userId + date
- goals.userId + status
- nutritionEntry.userId + date
- plan.userId + startDate

Do not add broad indexing prematurely. Index only where actual query patterns justify it.

## 8. Timestamps and Auditability

All key entities should include standard timestamps:

- createdAt
- updatedAt

Large audit or event tables are not required for MVP unless a real requirement emerges. The system should remain minimal but traceable.

## 9. Privacy and Security Considerations

- Health and fitness data are considered sensitive.
- PII should be reduced when possible.
- Password hashes must never be stored in plain text.
- Secrets and plaintext credentials must never be persisted in application tables.
- Refresh tokens may be persisted only as one-way hashes to support rotation and revocation.
- Logs must avoid writing sensitive values.

## 10. Deletion Behavior

- Deletion must be deliberate and explicit.
- User deletion is a sensitive operation and should be documented in the auth and security policies.
- Do not casually delete user data.
- Soft deletes may be considered if the product later decides to preserve history for compliance or recovery.

## 11. Prisma Modeling Conventions

Use Prisma conventions consistent with the project’s direction:

- Prisma schema lives in the backend or shared Prisma directory as appropriate to the final repo layout
- use explicit models with strong relation names
- use enums for statuses and categories when they are semantically meaningful
- keep Prisma models aligned with API contracts
- generate migration files rather than editing production schema directly

## 12. Phase 4 and Phase 5 Scope and Assumptions

The Phase 4 Prisma schema adds `Exercise`, `Workout`, and `WorkoutExercise`. The Phase 5 schema adds `WaterEntry` and `Measurement`; goals, charts, nutrition, plans, social, and AI models remain later work.

The API limits a workout to 50 exercise entries per create/update request to bound nested writes.

Open Decision:
Question: Should exercise names be unique per user, and should exercises have a fixed category taxonomy?
Why it matters: Both choices affect validation and how users reuse the exercise catalog.
Current assumption: Names may repeat and category remains optional free text; no supported requirement defines uniqueness or a controlled list.
Impact: The API allows the user to manage exercises without a taxonomy migration when requirements become clearer.

Open Decision:
Question: What should happen when deleting an exercise used by an existing workout?
Why it matters: Cascading deletion could erase the meaning of workout history.
Current assumption: Restrict deletion while workout entries reference the exercise.
Impact: The API returns a conflict and preserves existing workout records.

Open Decision:
Question: How should workout edits change their associated exercise entries?
Why it matters: Partial child-list mutation semantics can be ambiguous.
Current assumption: If `exerciseEntries` is supplied in a workout PATCH, it replaces the workout's complete entry list atomically; if omitted, entries are unchanged.
Impact: Clients can submit a complete, deterministic workout update without separate entry endpoints.

Open Decision:
Question: Should daily water intake support multiple drink events or a single daily total?
Why it matters: Multiple events require additional entry timestamps and aggregation behavior.
Current assumption: Store one editable total per user-selected calendar day, in milliliters.
Impact: The unique user/date key prevents duplicate daily totals; finer-grained drink events remain out of scope.

Open Decision:
Question: Which measurement units and fields should be presented to users?
Why it matters: Units affect storage, validation, comparison, and display.
Current assumption: Use the measurement fields already listed in this document, store weight in kilograms and body dimensions in centimeters, and convert weight for display/input using the profile preference.
Impact: Users can record only applicable metrics; a snapshot needs at least one value. Measurements are date-only, multiple snapshots per day are allowed, and charting remains Phase 6.

## 13. Current Assumptions

This database design is intentionally conservative. It supports the core fitness-tracking MVP and keeps optional social or AI features out of the schema until they are required.

The current Prisma schema contains `User`, `RefreshToken`, `Profile`, `Exercise`, `Workout`, `WorkoutExercise`, `WaterEntry`, and `Measurement`. Goals, nutrition, and plan models remain future phase work.
