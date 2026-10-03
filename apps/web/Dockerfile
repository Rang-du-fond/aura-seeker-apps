# syntax=docker/dockerfile:1
# Image of the web app: the static build served by unprivileged nginx.
# Build from the repository root:
#   docker build -f apps/web/Dockerfile -t aura-seeker-web .

ARG BUN_VERSION=1.4.2
ARG NGINX_VERSION=1.29

FROM oven/bun:${BUN_VERSION}-slim AS base
WORKDIR /app

# Keep only the web app and the workspace packages it depends on
# (packages/ui), with a lockfile pruned to match.
FROM base AS prepare
# Same major.minor as the `turbo` in the root package.json.
ARG TURBO_VERSION=2.11
COPY . .
RUN bunx turbo@${TURBO_VERSION} prune web --docker

FROM base AS builder
# Dependencies first: this layer is rebuilt only when a manifest or the
# lockfile changes.
COPY --from=prepare /app/out/json/ .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile
COPY --from=prepare /app/out/full/ .
# Where the app looks for the API. "/api" (the default) is proxied by nginx to
# API_URL at run time; a full URL is called directly by the browser, and that
# API must then allow the app's origin.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN bun run build --filter=web

# Unprivileged nginx: runs as user 101 and listens on 8080.
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine AS runtime
# The base image lags behind Alpine's security fixes: take them now.
USER root
RUN apk upgrade --no-cache
USER 101
# Lets the configuration template use the container's DNS servers.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    API_URL=http://api:8080
COPY apps/web/docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
