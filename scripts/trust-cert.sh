#!/usr/bin/env bash
set -euo pipefail

if ! command -v mkcert >/dev/null 2>&1; then
    echo "mkcert is required. Install with: brew install mkcert"
    exit 1
fi

mkcert -install
echo "Trusted local CA via mkcert."
