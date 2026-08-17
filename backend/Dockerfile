# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# ── Stage 2: run ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# tsc emits only .js — the Drizzle migrator reads the .sql files and its journal
# at runtime, so they have to be copied across separately.
COPY src/core/db/migrations ./dist/src/core/db/migrations

EXPOSE 8000
CMD ["node", "dist/src/index.js"]
