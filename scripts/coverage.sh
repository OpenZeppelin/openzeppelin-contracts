#!/usr/bin/env bash

set -o errexit -o pipefail

log() {
  echo "$*" >&2
}

ln -s coverageEnv/allFiredEvents allFiredEvents
OZ_TEST_ENV_COVERAGE=true npx solidity-coverage || log "Test run failed"

if [ "$CI" = true ]; then
  curl -s https://codecov.io/bash | bash -s -- -C "$CIRCLE_SHA1"
fi

rm -f allFiredEvents
