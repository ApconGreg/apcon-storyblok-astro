#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    source "$NVM_DIR/nvm.sh"
    cd "$ROOT_DIR"
    nvm use
else
    echo "nvm not found at $NVM_DIR/nvm.sh" >&2
fi

exec "${SHELL:-/bin/zsh}" -l
