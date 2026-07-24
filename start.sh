#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")"&&pwd)";[ -f "$root/.env" ]||{ echo "Copy .env.example to .env." >&2;exit 1;};[ -d "$root/backend/node_modules" ]&&[ -d "$root/frontend/node_modules" ]||{ echo "Run scripts/bootstrap.sh." >&2;exit 1;};set -a;. "$root/.env";set +a
: "${BACKEND_PORT:?BACKEND_PORT is required}" "${FRONTEND_PORT:?FRONTEND_PORT is required}"
for port in "$BACKEND_PORT" "$FRONTEND_PORT";do if command -v lsof >/dev/null&&lsof -ti ":$port" >/dev/null 2>&1;then echo "Port $port is already in use; refusing to stop another process." >&2;exit 1;fi;done
backend_pid='';frontend_pid='';cleanup(){ [ -z "$backend_pid" ]||kill "$backend_pid" 2>/dev/null||true;[ -z "$frontend_pid" ]||kill "$frontend_pid" 2>/dev/null||true;};trap cleanup EXIT INT TERM
(cd "$root/backend"&&npm start)&backend_pid=$!;(cd "$root/frontend"&&PORT="$FRONTEND_PORT" REACT_APP_API_BASE="http://127.0.0.1:$BACKEND_PORT/api" BROWSER=none npm start)&frontend_pid=$!;wait "$backend_pid" "$frontend_pid"
