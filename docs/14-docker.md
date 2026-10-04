# Docker

## Local containerized stack

Docker Compose runs PostgreSQL, a one-shot Prisma migration job, the NestJS API, and the Next.js web application. PostgreSQL data is kept in the named `pgdata` volume.

From the repository root:

1. Copy `.env.example` to `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Replace `JWT_SECRET` and `REFRESH_TOKEN_SECRET` with different random values of at least 32 UTF-8 bytes. In PowerShell:

   ```powershell
   $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
   $jwtBytes = New-Object byte[] 48
   $refreshBytes = New-Object byte[] 48
   $rng.GetBytes($jwtBytes)
   $rng.GetBytes($refreshBytes)
   [Convert]::ToBase64String($jwtBytes)
   [Convert]::ToBase64String($refreshBytes)
   ```

   Put those generated values in `.env`; do not commit that file.

3. Build and start the services:

   ```powershell
   docker compose --parallel 1 up --build -d
   ```

4. Wait for `docker compose ps` to report the API and web services as healthy. The migration service applies Prisma migrations before the API starts. Open [http://localhost:3000](http://localhost:3000); the API is published at `http://localhost:3001`.

The browser sends requests to same-origin `/api/v1` paths. Next.js forwards them to the API container using the build-time `API_INTERNAL_URL=http://api:3001`, so the browser does not need Docker service DNS or a hard-coded API host.

Docker Desktop must be running. Check service status with `docker compose ps`; inspect logs with `docker compose logs -f web api migrate postgres`. Stop services with `docker compose down`, which preserves the database volume. `docker compose down -v` deletes local database data and should only be used if that data can be discarded.

This Compose stack is for local development, not production deployment. Production requires managed secrets, TLS, backups, and deployment-specific operational configuration.
