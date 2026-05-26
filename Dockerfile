FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mecaniaos?schema=public"
ARG DIRECT_URL="postgresql://postgres:postgres@localhost:5432/mecaniaos?schema=public"
ARG SESSION_SECRET="replace-this-with-a-long-random-secret-123"
ARG APP_URL="http://localhost:3000"
ARG SUPABASE_URL="https://example.supabase.co"

ENV DATABASE_URL="${DATABASE_URL}"
ENV DIRECT_URL="${DIRECT_URL}"
ENV SESSION_SECRET="${SESSION_SECRET}"
ENV APP_URL="${APP_URL}"
ENV SUPABASE_URL="${SUPABASE_URL}"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["sh", "-c", "pnpm next start -H 0.0.0.0 -p ${PORT:-3000}"]
