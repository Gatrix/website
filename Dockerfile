FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_YANDEX_METRIKA_ID=109390759
ENV NEXT_PUBLIC_YANDEX_METRIKA_ID=$NEXT_PUBLIC_YANDEX_METRIKA_ID
ENV NEXT_TELEMETRY_DISABLED=1
RUN AUTH_SECRET=build-time-placeholder-secret-do-not-use-in-prod npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Добавляем наш скрипт который форсит порт 8080
COPY --chown=nextjs:nodejs custom-server.js ./custom-server.js
COPY --chown=nextjs:nodejs start.sh ./start.sh
# Strip Windows CRLF so shebang stays /bin/sh (otherwise exit 127 in Linux)
RUN sed -i 's/\r$//' ./start.sh && chmod +x ./start.sh

USER nextjs

EXPOSE 8080

CMD ["./start.sh"]