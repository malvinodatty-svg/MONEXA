#!/usr/bin/env bash
# Membuat file .env dengan secret acak. Aman dijalankan ulang (tidak menimpa .env yang ada).
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .env ]; then echo ".env sudah ada, tidak ditimpa."; exit 0; fi
rand() { head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c "$1"; }
sed -e "s|ganti_password_db|$(rand 24)|" \
    -e "s|ganti_password_root|$(rand 24)|" \
    -e "s|ganti_dengan_string_acak_panjang|$(rand 48)|" \
    -e "s|ganti_secret_storage|$(rand 24)|" .env.example > .env
echo ".env dibuat dengan secret acak."
