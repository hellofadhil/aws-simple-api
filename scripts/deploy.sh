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

git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git reset --hard "origin/${BRANCH}"

bun install --frozen-lockfile
bun run prisma:generate
bun run prisma:migrate:deploy

sudo systemctl restart simple-api
sudo systemctl status simple-api --no-pager
