#!/usr/bin/env bash
# Smoke test: register -> login -> saldo lewat reverse proxy. Dipakai manual & di CI.
set -euo pipefail
BASE="${BASE_URL:-http://localhost:${APP_PORT:-8080}}"
EMAIL="smoke$(date +%s)@example.com"

echo "[1/4] Frontend  GET $BASE/"
curl -fsS -o /dev/null "$BASE/"

echo "[2/4] Register  POST /api/auth/register"
curl -fsS -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' \
  -d "{\"name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"password123\",\"role\":\"USER\"}" >/dev/null

echo "[3/4] Login     POST /api/auth/login"
RESP=$(curl -fsS -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"password123\"}")
TOKEN=$(printf '%s' "$RESP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
[ -n "$TOKEN" ] || { echo "token tidak ditemukan: $RESP"; exit 1; }

echo "[4/4] Saldo     GET /api/wallet/balance"
curl -fsS "$BASE/api/wallet/balance" -H "Authorization: Bearer $TOKEN"
echo; echo "SMOKE TEST OK"
