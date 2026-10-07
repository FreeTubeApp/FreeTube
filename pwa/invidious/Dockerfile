# syntax=docker/dockerfile:1
#
# All-in-one Invidious image: Invidious, Invidious companion and PostgreSQL in a single container,
# managed by supervisord. Invidious and Invidious companion are taken from their official images.
#
# Published by .github/workflows/pwa-images.yml, build it locally with pwa/compose.build.yaml.

# Image tags, can be changed with build args.
# Invidious' "latest" tag is updated rarely, "master" follows the development branch and gets fixes for YouTube changes sooner.
ARG INVIDIOUS_TAG=master
ARG COMPANION_TAG=latest

FROM quay.io/invidious/invidious:${INVIDIOUS_TAG} AS invidious
FROM quay.io/invidious/invidious-companion:${COMPANION_TAG} AS companion

# Invidious companion is a glibc binary built on Debian trixie, Invidious is a static binary.
# The PostgreSQL major version is pinned, as the data directory is tied to it.
FROM postgres:17-trixie

# ca-certificates: TLS connections to YouTube
# curl: health check
# librsvg2-bin, fonts-open-sans: captchas (same as the official Invidious image)
# openssl: generating the secret keys
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl fonts-open-sans librsvg2-bin openssl supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 1000 --user-group --home-dir /invidious --no-create-home invidious

COPY --from=invidious /invidious /invidious
COPY --from=companion /app/invidious_companion /app/invidious_companion

COPY config.yml /invidious/config/config.yml
COPY supervisord.conf /etc/supervisor/supervisord.conf
COPY --chmod=0755 entrypoint.sh run-invidious.sh /usr/local/bin/

# Invidious uses a statically linked OpenSSL, point it to the system certificates
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt \
    SSL_CERT_DIR=/etc/ssl/certs

# The volume at /var/lib/postgresql/data holds the database cluster (pgdata/) and the generated keys (secrets.env)
ENV PGDATA=/var/lib/postgresql/data/pgdata

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS -o /dev/null http://127.0.0.1:3000/api/v1/stats || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
