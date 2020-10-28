#!/usr/bin/env bash

set -euo pipefail

buidler coverage

if [ -n "$CI" ]; then
  curl -s https://codecov.io/bash | bash -s -- -C "$CIRCLE_SHA1"
fi
