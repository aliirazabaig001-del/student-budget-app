# SkoolLedger API image: builds the NestJS app and ships only production files.

# Alpine already ships libssl3 (needed by Prisma), so no OS packages are
# installed: builds work even where Debian/Alpine mirrors are blocked.
ARG NODE_IMAGE=node:22-alpine
ARG PNPM_VERSION=10.33.0

# ---------------------------------------------------------------- build ----
FROM ${NODE_IMAGE} AS build
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /repo

# Dependency layer (cached until a package.json or the lockfile changes).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile --filter "@skoolledger/api..."

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @skoolledger/shared build \
 && pnpm --filter @skoolledger/api exec prisma generate \
 && pnpm --filter @skoolledger/api build \
 && pnpm --filter @skoolledger/api deploy --prod --legacy /out \
 && cd /out && ./node_modules/.bin/prisma generate

# -------------------------------------------------------------- runtime ----
FROM ${NODE_IMAGE} AS runtime

ENV NODE_ENV=production \
    API_PORT=3000 \
    UPLOAD_DIR=/app/uploads
WORKDIR /app

COPY --from=build --chown=node:node /out ./
COPY --chown=node:node docker/api-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod 0755 /app/docker-entrypoint.sh && mkdir -p /app/uploads && chown node:node /app/uploads

USER node
EXPOSE 3000
VOLUME ["/app/uploads"]

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# docker-compose.yml sets `init: true`, so signals are forwarded and zombie
# processes reaped without bundling an init binary.
ENTRYPOINT ["/app/docker-entrypoint.sh"]
