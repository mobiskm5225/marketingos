# The frontend is TanStack Start (SSR via Nitro), not a static SPA — route
# loaders fetch from the API on the server. It ships as a Node server, so there
# is no nginx stage here.

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Baked in at build time: Vite inlines VITE_* into the client bundle.
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL

# Without this Nitro auto-detects a Cloudflare Worker preset and emits
# wrangler.json instead of a runnable Node server.
ENV NITRO_PRESET=node-server
RUN npm run build

# ── Stage 2: run ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# .output is self-contained — Nitro bundles its own dependencies.
COPY --from=builder /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
