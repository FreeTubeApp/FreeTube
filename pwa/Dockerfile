# syntax=docker/dockerfile:1
#
# Builds the FreeTube PWA and serves it with nginx.
# The build context has to be the repository root, e.g.:
#   docker build -f pwa/Dockerfile -t freetube-pwa .
# or use pwa/compose.build.yaml

# The build output does not depend on the target architecture,
# so the build stage always runs natively (no emulation for multi-platform images)
FROM --platform=$BUILDPLATFORM node:24-slim AS build

# CI: skips the git hook installation of lefthook
# ELECTRON_SKIP_BINARY_DOWNLOAD: Electron itself is not needed for the web build
ENV CI=true \
    ELECTRON_SKIP_BINARY_DOWNLOAD=1

RUN npm install --global pnpm@10

WORKDIR /app

# Install the dependencies in a separate layer, so that it only gets rebuilt when they change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec webpack --mode=production --config-node-env=production --config pwa/webpack.pwa.config.js


FROM nginxinc/nginx-unprivileged:stable-alpine

# Invidious instance that the PWA uses by default, e.g. https://invidious.example.com
ENV FREETUBE_DEFAULT_INVIDIOUS_INSTANCE=""

# The nginx image fills in the environment variables in templates on startup
COPY pwa/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/web /usr/share/nginx/html

EXPOSE 8080
