#!/usr/bin/env bash

set -euo pipefail

if [ "${SKIP_COMPILE:-}" == true ]; then
  exit
fi

npm run clean
env COMPILE_MODE=production npm run compile
