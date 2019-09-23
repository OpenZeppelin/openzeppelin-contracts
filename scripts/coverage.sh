#!/usr/bin/env bash

set -o errexit -o pipefail

log() {
  echo "$*" >&2
}

npx truffle run coverage --network development

if [ "$CI" = true ]; then
  curl -s https://codecov.io/bash | bash -s -- -C "$CIRCLE_SHA1"
fi
