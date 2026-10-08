# syntax=docker/dockerfile:1.7
#
# CSQ web app image: Vite build, then nginx serving the static bundle under
# /app/. On the box the host nginx owns the hostname: / is the landing site,
# /app/ is this container, /api/ is the API
# (td-csq-backend/deploy/nginx/csq-single-host.conf).
#
# Configuration is BUILD-TIME. src/auth/keycloak.ts and src/api/client.ts read
# only `import.meta.env.VITE_*`, which Vite inlines into the bundle; there is
# no runtime config file. Changing any of these means rebuilding the image:
#
#   VITE_BASE_PATH          /app/   the public path (Vite `base`, router
#                                   basename). deploy/nginx/nginx.conf is
#                                   written for exactly this value and the
#                                   build refuses any other.
#   VITE_API_BASE_URL       /api/v1 same origin as the app; an absolute URL
#                                   (https://api.example/api/v1) also works
#                                   and is added to the CSP connect-src.
#   VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, VITE_KEYCLOAK_CLIENT_ID
#
#   docker build -t csq-web:$(git rev-parse --short HEAD) .
#
# deploy/render-headers.mjs derives the Content-Security-Policy from the same
# values and hashes the inline <script> in index.html so script-src never
# needs 'unsafe-inline'. The base path does not change the CSP.
#
# The runtime stage follows landing/Dockerfile: nginx:alpine, non-root on
# port 8080, /healthz, immutable /app/assets, no-cache index.html, SPA
# fallback under /app/, 404 for everything else.
#
# Needs about 2 GB of RAM for the Vite build (echarts). On a smaller box build
# elsewhere and ship the image: docker save csq-web:<tag> | gzip > csq-web.tgz,
# then docker load < csq-web.tgz on the box.

ARG NODE_VERSION=22
ARG NGINX_VERSION=1.27

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .

# Declared after the dependency layers so a changed value re-runs only the
# build. .dockerignore keeps .env files out of the context, so these are the
# only source of VITE_* values Vite sees.
ARG VITE_BASE_PATH=/app/
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_KEYCLOAK_URL=https://auth.tinydata.in/
ARG VITE_KEYCLOAK_REALM=csq
ARG VITE_KEYCLOAK_CLIENT_ID=csq-frontend
ENV VITE_BASE_PATH=${VITE_BASE_PATH} \
    VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_KEYCLOAK_URL=${VITE_KEYCLOAK_URL} \
    VITE_KEYCLOAK_REALM=${VITE_KEYCLOAK_REALM} \
    VITE_KEYCLOAK_CLIENT_ID=${VITE_KEYCLOAK_CLIENT_ID}
RUN test "${VITE_BASE_PATH}" = "/app/" \
    || { echo "VITE_BASE_PATH must be /app/ (got '${VITE_BASE_PATH}'): deploy/nginx/nginx.conf serves the bundle at that path" >&2; exit 1; }
RUN test -n "${VITE_API_BASE_URL}" || { echo "build arg VITE_API_BASE_URL must not be empty (default /api/v1)" >&2; exit 1; }

# `npm run build` = tsc --noEmit + vite build (README). Then render the nginx
# headers include from the built index.html and the VITE_* values, and check
# that the base path reached the bundle (index.html must load /app/assets/…).
RUN npm run build \
    && node deploy/render-headers.mjs dist/index.html deploy/nginx/headers.conf.template /app/csq-headers.conf \
    && grep -q 'src="/app/assets/' dist/index.html

FROM nginx:${NGINX_VERSION}-alpine AS runtime

# Drop the default site so it cannot shadow ours
RUN rm -f /etc/nginx/conf.d/default.conf

COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/csq-headers.conf /etc/nginx/csq-headers.conf
# The bundle lives at <root>/app so that /app/assets/x.js maps to a file
# without `alias`; nginx.conf keeps root = /usr/share/nginx/html.
COPY --from=build /app/dist /usr/share/nginx/html/app

# Run unprivileged. Port 8080 rather than 80 because a non-root process cannot
# bind below 1024; the host nginx proxies /app/ to this port.
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx \
    && touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
