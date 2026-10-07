#!/bin/bash
set -euo pipefail

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

DATA_DIR=/var/lib/postgresql/data
SECRETS_FILE="$DATA_DIR/secrets.env"

# Public address of Invidious, e.g. https://invidious.example.com or http://localhost:3000.
# Sets domain, https_only and external_port, unless they are set explicitly.
if [[ -n "${INVIDIOUS_PUBLIC_URL:-}" ]]; then
  if [[ ! "$INVIDIOUS_PUBLIC_URL" =~ ^(https?)://([^/:]+)(:([0-9]+))?/?$ ]]; then
    fail "INVIDIOUS_PUBLIC_URL has to look like https://invidious.example.com or http://localhost:3000, got: $INVIDIOUS_PUBLIC_URL"
  fi

  scheme="${BASH_REMATCH[1]}"
  host="${BASH_REMATCH[2]}"
  port="${BASH_REMATCH[4]}"

  if [[ "$scheme" == https ]]; then
    https_only=true
    port="${port:-443}"
  else
    https_only=false
    port="${port:-80}"
  fi

  export INVIDIOUS_DOMAIN="${INVIDIOUS_DOMAIN:-$host}"
  export INVIDIOUS_HTTPS_ONLY="${INVIDIOUS_HTTPS_ONLY:-$https_only}"
  export INVIDIOUS_EXTERNAL_PORT="${INVIDIOUS_EXTERNAL_PORT:-$port}"
fi

if [[ -z "${INVIDIOUS_DOMAIN:-}" ]]; then
  fail 'Set INVIDIOUS_PUBLIC_URL (e.g. https://invidious.example.com), Invidious needs it for absolute URLs like thumbnails.'
fi

# Generate the secret keys on the first start and keep them in the data volume,
# unless they are passed as environment variables
mkdir -p "$DATA_DIR"
chown postgres:postgres "$DATA_DIR"
chmod 700 "$DATA_DIR"

if [[ -f "$SECRETS_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$SECRETS_FILE"
fi

if [[ -z "${INVIDIOUS_HMAC_KEY:-}" || -z "${INVIDIOUS_COMPANION_KEY:-}" ]]; then
  GENERATED_HMAC_KEY="${GENERATED_HMAC_KEY:-$(openssl rand -hex 16)}"
  GENERATED_COMPANION_KEY="${GENERATED_COMPANION_KEY:-$(openssl rand -hex 8)}"

  printf 'GENERATED_HMAC_KEY=%s\nGENERATED_COMPANION_KEY=%s\n' "$GENERATED_HMAC_KEY" "$GENERATED_COMPANION_KEY" > "$SECRETS_FILE"
  chmod 600 "$SECRETS_FILE"

  INVIDIOUS_HMAC_KEY="${INVIDIOUS_HMAC_KEY:-$GENERATED_HMAC_KEY}"
  INVIDIOUS_COMPANION_KEY="${INVIDIOUS_COMPANION_KEY:-$GENERATED_COMPANION_KEY}"
fi

if [[ ${#INVIDIOUS_COMPANION_KEY} -ne 16 ]]; then
  fail 'INVIDIOUS_COMPANION_KEY has to be exactly 16 characters long. Generate one with: openssl rand -hex 8'
fi

export INVIDIOUS_HMAC_KEY
# Share the companion key between Invidious and Invidious companion
export INVIDIOUS_INVIDIOUS_COMPANION_KEY="$INVIDIOUS_COMPANION_KEY"
export SERVER_SECRET_KEY="$INVIDIOUS_COMPANION_KEY"

# The Invidious documentation recommends restarting Invidious regularly, see run-invidious.sh
export INVIDIOUS_RESTART_INTERVAL="${INVIDIOUS_RESTART_INTERVAL:-1h}"

# Initialize the database cluster on the first start.
# Trust authentication is fine, as PostgreSQL only listens on 127.0.0.1 inside this container.
if [[ ! -s "$PGDATA/PG_VERSION" ]]; then
  echo 'Initializing PostgreSQL data directory'
  mkdir -p "$PGDATA"
  chown postgres:postgres "$PGDATA"
  gosu postgres initdb --pgdata="$PGDATA" --username=postgres --auth=trust --encoding=UTF8 --locale=C.UTF-8
fi

echo "Invidious: domain=${INVIDIOUS_DOMAIN} https_only=${INVIDIOUS_HTTPS_ONLY:-false} external_port=${INVIDIOUS_EXTERNAL_PORT:-3000}"

exec /usr/bin/supervisord --nodaemon --configuration /etc/supervisor/supervisord.conf
