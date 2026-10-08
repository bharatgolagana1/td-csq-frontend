# syntax=docker/dockerfile:1.7
#
# CSQ web app image: Vite build, then nginx serving the static bundle.
#
# Configuration is BUILD-TIME. src/auth/keycloak.ts and src/api/client.ts read
# only `import.meta.env.VITE_*`, which Vite inlines into the bundle; there is
# no runtime config file. Changing the API or Keycloak location means
# rebuilding the image with new --build-arg values:
#
#   docker build \
#     --build-arg VITE_API_BASE_URL=https://api.dev.csq.aero/api/v1 \
#     --build-arg VITE_KEYCLOAK_URL=https://auth.tinydata.in/ \
#     -t csq-web:$(git rev-parse --short HEAD) .
#
# The same values shape the Content-Security-Policy: deploy/render-headers.mjs
# derives connect-src / frame-src from them and hashes the inline <script>
# in index.html so script-src never needs 'unsafe-inline'.
#
# The runtime stage follows landing/Dockerfile: nginx:alpine, non-root on
# port 8080, /healthz, immutable /assets, no-cache index.html, SPA fallback.

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
ARG VITE_API_BASE_URL
ARG VITE_KEYCLOAK_URL=https://auth.tinydata.in/
ARG VITE_KEYCLOAK_REALM=csq
ARG VITE_KEYCLOAK_CLIENT_ID=csq-frontend
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_KEYCLOAK_URL=${VITE_KEYCLOAK_URL} \
    VITE_KEYCLOAK_REALM=${VITE_KEYCLOAK_REALM} \
    VITE_KEYCLOAK_CLIENT_ID=${VITE_KEYCLOAK_CLIENT_ID}
RUN test -n "${VITE_API_BASE_URL}" || { echo "build arg VITE_API_BASE_URL is required, e.g. https://api.dev.csq.aero/api/v1" >&2; exit 1; }

# `npm run build` = tsc --noEmit + vite build (README). Then render the nginx
# headers include from the built index.html and the VITE_* values.
RUN npm run build \
    && node deploy/render-headers.mjs dist/index.html deploy/nginx/headers.conf.template /app/csq-headers.conf

FROM nginx:${NGINX_VERSION}-alpine AS runtime

# Drop the default site so it cannot shadow ours
RUN rm -f /etc/nginx/conf.d/default.conf

COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/csq-headers.conf /etc/nginx/csq-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Run unprivileged. Port 8080 rather than 80 because a non-root process cannot
# bind below 1024; the host nginx maps 443 to this.
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx \
    && touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
