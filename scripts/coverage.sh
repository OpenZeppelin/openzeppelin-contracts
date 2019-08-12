#!/usr/bin/env bash

set -o errexit -o pipefail

log() {
  echo "$*" >&2
}

SOLIDITY_COVERAGE=true scripts/test.sh || log "Test run failed"

if [ "$CI" = true ]; then
  curl -s https://codecov.io/bash | bash -s -- -C "$CIRCLE_SHA1"
fi
