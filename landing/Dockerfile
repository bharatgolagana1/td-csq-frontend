# The landing page is pure static output: no build step, no application, and
# nothing secret. A single stage is honest here; a builder stage would only
# add surface area.
FROM nginx:1.27-alpine

# Drop the default site so it cannot shadow ours
RUN rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY index.html /usr/share/nginx/html/index.html
COPY assets/    /usr/share/nginx/html/assets/

# Run unprivileged. Port 8080 rather than 80 because a non-root process cannot
# bind below 1024; the reverse proxy in front maps 443 to this.
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx \
    && touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
