# Database Migrations

## 1. Migration Philosophy

The project uses Prisma migrations as the standard mechanism for evolving the PostgreSQL schema. This keeps changes reviewable, reproducible, and more predictable in shared development environments.

## 2. Development Workflow

When a schema change is needed:

1. Update the Prisma schema in the appropriate project location.
2. Generate a new migration.
3. Review the generated SQL and relationship changes.
4. Validate the migration against model relationships and domain requirements.
5. Run the relevant local tests or migration smoke checks.
6. Commit the migration file and any affected code changes together.

## 3. Migration Review

Each migration should be checked for:

- accidental destructive change
- unexpected relationship updates
- missing index or unique constraints
- incorrect defaults or timestamp handling
- overly broad data changes
- compatibility with existing data

The Phase 2 refresh-token migration hashes existing stored tokens and revokes those sessions so plaintext credentials are not retained. Users with pre-migration refresh tokens must sign in again.

## 4. Production Safety

Production migrations must be treated carefully. Before applying a migration to a production environment, the team should confirm:

- the migration is required and approved
- the affected data flows are understood
- rollback strategy has been considered
- the migration is tested in a representative environment
- no unnecessary destructive migration is included

## 5. Seed Data

Seed data may be used for local development and testing. Seed scripts must be explicit and not create unsafe production assumptions. Seed data should only include realistic non-sensitive test content.

## 6. Destructive Migration Rules

Destructive changes must be treated as high-risk and should not be merged casually.

Examples of destructive migration operations:

- dropping tables
- removing columns used by application logic
- deleting unique constraints needed for data integrity
- changing required relationships without a safe migration path

The team must review and justify destructive changes before applying them.

## 7. Rollback Considerations

A migration is not complete until the team understands the rollback path or alternate recovery approach. This is particularly important for:

- data shape changes
- relationship modifications
- production schema updates
- migrations with user-data impact

## 8. Never Casually Reset or Destroy Data

The project explicitly requires care around any database reset or destructive action. A reset should only be used for a clearly understood local development environment or an explicitly approved lower-risk operation. Never casually reset a database that may contain important data.

## 9. Migration Safety Checklist

Before merging a migration, confirm:

- the migration matches documented entities and relationships
- user-owned data remains protected
- indexes and uniqueness constraints are intentional
- no hidden business rules were introduced
- tests cover the affected persistence paths

## 10. Future Considerations

As the application grows, migration review and deployment standards may need to expand to include staging validation, snapshot checks, and more formal release controls. For MVP, the goal is a clear, disciplined migration process.
