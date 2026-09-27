# Environment Configuration

## 1. Purpose

The application requires environment-specific configuration for the web app, API, database, and local tooling. Configuration values must be managed securely and never committed to source control.

## 2. Environment Types

### Development environment

- local developer setup
- Docker-based PostgreSQL and local app services
- easier debugging, hot reload, and migration testing

### Test environment

- isolated validation environment for unit, integration, and E2E tests
- separate database credentials and app settings from local development

### Production environment

- deployment-specific environment values
- secure secret storage and release controls
- minimal and tightly scoped configuration

## 3. Required Variable Categories

The system will require values for:

- Next.js application config
- NestJS API config
- PostgreSQL connection settings
- Prisma database URL
- JWT secrets
- refresh token secrets
- app base URL
- Docker-related environment settings when applicable
- optional future integrations

## 4. Example Environment Template

The project should include a `.env.example` file that documents the expected variable names without including secret values.

Example shape:

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# API
API_PORT=3001
API_BASE_URL=http://localhost:3001
JWT_SECRET=replace-me
REFRESH_TOKEN_SECRET=replace-me

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fitness_tracker_dev

# Docker
POSTGRES_DB=fitness_tracker_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

The exact values may evolve as the project is scaffolded.

## 5. Secret Handling

- do not commit secrets
- use environment files only for local development and local examples
- use secure secret stores or deployment secret managers in production
- rotate secrets when compromised or when infrastructure changes

## 6. Configuration Validation

The project should validate required env variables during startup or app boot, especially for:

- database connectivity
- auth secrets
- production mode checks
- external service configuration

## 7. Current Assumptions

The exact environment naming convention will be finalized as the project scaffolding is created. This document records the expected categories and privacy rules without inventing backend-specific secrets beyond the project’s documented stack.
