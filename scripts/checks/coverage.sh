#!/usr/bin/env bash

export COVERAGE=true
export FOUNDRY_FUZZ_RUNS=10

# Hardhat coverage
npx hardhat coverage

# Foundry coverage
forge coverage --report lcov
# Remove test and mock data
lcov --rc derive_function_end_line=0 -o lcov.info --remove lcov.info 'test/*' 'contracts/mocks/*'
# Remove zero hits
awk '!/,0/' lcov.info > temp && mv temp lcov.info

# Reports are then uploaded to Codecov automatically by workflow, and merged.
