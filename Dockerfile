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

ARG BUILD_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public"
ARG BUILD_DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public"
ARG BUILD_SESSION_SECRET="replace-this-with-a-long-random-secret-1234567890"
ARG BUILD_APP_URL="http://localhost:3000"
ARG BUILD_SUPABASE_URL="https://example.supabase.co"

ENV DATABASE_URL="${BUILD_DATABASE_URL}"
ENV DIRECT_URL="${BUILD_DIRECT_URL}"
ENV SESSION_SECRET="${BUILD_SESSION_SECRET}"
ENV APP_URL="${BUILD_APP_URL}"
ENV SUPABASE_URL="${BUILD_SUPABASE_URL}"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public"
ENV DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public"
ENV SESSION_SECRET="replace-this-with-a-long-random-secret-1234567890"
ENV APP_URL="http://localhost:3000"
ENV SUPABASE_URL="https://example.supabase.co"

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

CMD ["sh", "-c", "if [ -n \"${BOOTSTRAP_ADMIN_EMAIL:-}\" ] && [ -n \"${BOOTSTRAP_ADMIN_PASSWORD:-}\" ]; then pnpm db:bootstrap; fi; exec pnpm next start -H 0.0.0.0 -p ${PORT:-3000}"]
