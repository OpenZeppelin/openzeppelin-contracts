#!/usr/bin/env bash

SOLIDITY_COVERAGE=true scripts/test.sh

if [ "$CI" = true ]; then
  curl -s https://codecov.io/bash | bash -s -- -C "$CIRCLE_SHA1"
fi
