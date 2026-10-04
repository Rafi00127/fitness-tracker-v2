FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG API_INTERNAL_URL=http://localhost:3001
ENV API_INTERNAL_URL=${API_INTERNAL_URL}

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci

COPY apps/web ./apps/web

RUN npm run build:web

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/next.config.ts

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/login').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "--prefix", "apps/web", "run", "start", "--", "--hostname", "0.0.0.0"]
