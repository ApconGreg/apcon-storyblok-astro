#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="${ROOT_DIR}/certs"
KEY_FILE="${CERT_DIR}/localhost-key.pem"
CERT_FILE="${CERT_DIR}/localhost.pem"

mkdir -p "${CERT_DIR}"

if ! command -v mkcert >/dev/null 2>&1; then
    echo "mkcert is required. Install with: brew install mkcert"
    exit 1
fi

mkcert -install
mkcert -key-file "${KEY_FILE}" -cert-file "${CERT_FILE}" localhost 127.0.0.1 ::1

echo "Generated ${CERT_FILE} and ${KEY_FILE}"
