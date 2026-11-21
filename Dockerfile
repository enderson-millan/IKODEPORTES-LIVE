# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-alpine
ARG PNPM_VERSION=10.30.3

# ── Shared base ──────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ── Web: dependencies ────────────────────────────────────────────────────────
FROM base AS web-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Web: build ───────────────────────────────────────────────────────────────
FROM base AS web-builder
COPY --from=web-deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined at build time, so they must be build args.
ARG NEXT_PUBLIC_WS_URL=""
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN pnpm build

# ── Web: runtime (Next.js standalone) ────────────────────────────────────────
FROM node:${NODE_VERSION} AS web
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=web-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=web-builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=web-builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# ── API: dependencies ────────────────────────────────────────────────────────
FROM base AS api-deps
WORKDIR /app/backend
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── API: build (tsup bundle + Prisma client) ─────────────────────────────────
FROM base AS api-builder
WORKDIR /repo
COPY --from=api-deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY shared ./shared
COPY prisma ./prisma
RUN cd backend && pnpm run build
RUN cd backend && pnpm run prisma:generate

# ── API: runtime ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS api
WORKDIR /app
ENV NODE_ENV=production PORT=4000
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 api
COPY --from=api-builder --chown=api:nodejs /repo/backend/package.json ./package.json
# Dev dependencies are kept on purpose: `prisma migrate deploy` runs inside this image.
COPY --from=api-builder --chown=api:nodejs /repo/backend/node_modules ./node_modules
COPY --from=api-builder --chown=api:nodejs /repo/backend/dist ./dist
COPY --from=api-builder --chown=api:nodejs /repo/prisma ./prisma
USER api
EXPOSE 4000
CMD ["node", "dist/index.js"]
