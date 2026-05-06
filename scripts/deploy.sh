#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/simple-api}"
BRANCH="${BRANCH:-main}"

if ! command -v bun >/dev/null 2>&1; then
  export BUN_INSTALL="${HOME}/.bun"
  export PATH="${BUN_INSTALL}/bin:${PATH}"
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "bun is not installed or not available in PATH" >&2
  exit 1
fi

if [ ! -d "${APP_DIR}/.git" ]; then
  echo "APP_DIR does not contain a git repository: ${APP_DIR}" >&2
  exit 1
fi

cd "${APP_DIR}"

PREVIOUS_REV="$(git rev-parse HEAD)"

git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git reset --hard "origin/${BRANCH}"

CURRENT_REV="$(git rev-parse HEAD)"
CHANGED_FILES="$(git diff --name-only "${PREVIOUS_REV}" "${CURRENT_REV}")"
PRISMA_CLIENT_MISSING="false"

bun install --frozen-lockfile

if [ ! -f "node_modules/.prisma/client/client.js" ]; then
  PRISMA_CLIENT_MISSING="true"
fi

if [ "${PRISMA_CLIENT_MISSING}" = "true" ] || printf '%s\n' "${CHANGED_FILES}" | grep -Eq '^(prisma/|prisma\.config\.ts$|package\.json$|bun\.lock$)'; then
  echo "Prisma generate required. Running generate."
  bun run prisma:generate
else
  echo "No Prisma generate needed."
fi

if printf '%s\n' "${CHANGED_FILES}" | grep -Eq '^(prisma/|prisma\.config\.ts$)'; then
  echo "Prisma schema or migration changes detected. Running migrate deploy."
  bun run prisma:migrate:deploy
else
  echo "No Prisma schema or migration changes detected. Skipping migrate deploy."
fi

sudo systemctl restart simple-api
sudo systemctl status simple-api --no-pager
