#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.."&&pwd)";set -a;. "$root/.env";set +a;case "${CONFIRM_DEMO_SEED:-}" in yes|YES);;*)echo "Set CONFIRM_DEMO_SEED=yes." >&2;exit 1;;esac;[ "${NODE_ENV:-development}" != production ]||{ echo "Refusing production seed." >&2;exit 1;};(cd "$root/backend"&&npm run seed)
