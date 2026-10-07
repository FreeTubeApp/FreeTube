#!/bin/bash
set -euo pipefail

until pg_isready --host=127.0.0.1 --quiet; do
  echo 'Waiting for PostgreSQL'
  sleep 1
done

# Create the database user and database if they don't exist yet, Invidious creates the tables itself (check_tables)
psql --host=127.0.0.1 --username=postgres --quiet --no-align --tuples-only --set=ON_ERROR_STOP=1 <<'SQL'
SELECT 'CREATE ROLE kemal LOGIN' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'kemal')\gexec
SELECT 'CREATE DATABASE invidious OWNER kemal' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'invidious')\gexec
SQL

# Invidious gets stopped after INVIDIOUS_RESTART_INTERVAL and supervisord starts it again
exec timeout --kill-after=10s "$INVIDIOUS_RESTART_INTERVAL" /invidious/invidious
