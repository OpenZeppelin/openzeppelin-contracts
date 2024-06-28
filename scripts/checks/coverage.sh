#!/usr/bin/env bash

set -euo pipefail

export COVERAGE=true
export FOUNDRY_FUZZ_RUNS=10

# Hardhat coverage
hardhat coverage

if [ "${CI:-"false"}" == "true" ]; then
  # Foundry coverage
  forge coverage --report lcov
  # Remove test and mock data
  lcov --rc derive_function_end_line=0 -o lcov.info --remove lcov.info 'test/*' 'contracts/mocks/*'
  # Remove zero hits
  sed -i '/,0/d' lcov.info
fi

# Reports are then uploaded to Codecov automatically by workflow, and merged.
