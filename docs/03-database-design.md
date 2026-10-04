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

Likely fields:

- id
- userId
- name
- category (e.g. cardio, strength, mobility)
- notes
- createdAt
- updatedAt

Rules:

- user-owned exercise catalog
- names may need uniqueness within the user scope

### Workout

Purpose: records a workout session.

Likely fields:

- id
- userId
- title
- date
- durationMinutes
- notes
- createdAt
- updatedAt

Rules:

- workouts belong to one user
- timestamps must be stored consistently

### WorkoutExercise

Purpose: maps exercises to workout sessions and records session details.

Likely fields:

- id
- workoutId
- exerciseId
- sets
- reps
- weight
- durationSeconds
- notes
- createdAt
- updatedAt

Rules:

- exercise and workout must belong to the same user or enforce ownership at the application layer
- relationship must be explicit

### WaterEntry

Purpose: stores daily fluid intake records.

Likely fields:

- id
- userId
- date
- amountMl
- notes
- createdAt
- updatedAt

Rules:

- unique constraints may apply to daily entries depending on desired behavior
- data must support trend tracking over time

### Measurement

Purpose: records body measurements over time.

Likely fields:

- id
- userId
- date
- weightKg
- waistCm
- chestCm
- hipCm
- bicepsCm
- bodyFatPercent
- notes
- createdAt
- updatedAt

Rules:

- measurement values should be nullable where not always applicable
- historical tracking should be preserved

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

## 12. Current Assumptions

This database design is intentionally conservative. It supports the core fitness-tracking MVP and keeps optional social or AI features out of the schema until they are required.

Later conceptual entities in this document are not implemented by Phase 3. The current Prisma schema contains `User`, `RefreshToken`, and `Profile`; workout, water, measurement, goal, nutrition, and plan models remain future phase work.
