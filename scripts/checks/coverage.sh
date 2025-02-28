#!/usr/bin/env bash

set -euo pipefail

export COVERAGE=true
export FOUNDRY_FUZZ_RUNS=10

. scripts/set-max-old-space-size.sh

# Hardhat coverage
hardhat coverage

if [ "${CI:-"false"}" == "true" ]; then
  # Foundry coverage
  forge coverage --report lcov --ir-minimum
  # Remove zero hits
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' '/,0/d' lcov.info
  else
    sed -i '/,0/d' lcov.info
  fi
fi

# Reports are then uploaded to Codecov automatically by workflow, and merged.
