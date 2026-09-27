# Git Workflow

## 1. Branch Strategy

The project should use a simple branch workflow aligned with small, reviewable changes.

Recommended structure:

- `main` for the stable default branch
- feature branches for focused work
- short-lived branch names describing the implementation area

## 2. Commit Conventions

Use Conventional Commits unless the project explicitly changes this direction.

Examples:

- `feat: add auth login flow`
- `fix: correct workout ownership check`
- `docs: update architecture overview`
- `test: add dashboard Playwright flow`
- `chore: configure Prisma migration workflow`

## 3. Pull Request Expectations

Pull requests should:

- be narrow and reviewable
- include a clear description of scope and rationale
- reference related requirements or design docs when relevant
- include validation details
- avoid unrelated refactors or scope expansion

## 4. Code Review

Code review should check:

- requirement alignment
- security and authorization correctness
- documentation updates where needed
- test coverage for behavior changes
- migration safety when schema changes are involved

## 5. Merge Strategy

The project should prefer a straightforward merge strategy that preserves a clean history and supports disciplined team review. The exact merge policy can be adjusted later if the team chooses a different standard.

## 6. Generated Files

Generated files such as Prisma outputs, build artifacts, or lock files should be managed deliberately. Generated code should not be hand-edited unless the toolchain explicitly requires it.

## 7. Migration Changes

Database changes must be reviewed with additional care. A migration-related PR should clearly indicate:

- the schema change
- the expected data impact
- rollback or recovery considerations
- validation performed

## 8. Release and Versioning Expectations

The project should keep versioning straightforward and explicit. At this stage, the primary goal is clear engineering discipline rather than a complex release process.
