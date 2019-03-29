#!/usr/bin/env bash

SOLIDITY_COVERAGE=true npm run test

if [ "$CONTINUOUS_INTEGRATION" = true ]; then
  cat coverage/lcov.info | coveralls
fi
