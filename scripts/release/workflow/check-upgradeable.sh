#!/usr/bin/env bash

set -euo pipefail

# Get commit hash (short) of the reference commit (non-upgradeable version)
cd lib/openzeppelin-contracts
REFERENCE_COMMIT="$(git rev-parse --short HEAD)"

# Check that the commit message of the local commit (upgradeable version) matches the reference commit
cd ../..
if ! git log -1 --pretty=%B | grep -q "Transpile ${REFERENCE_COMMIT}"; then
  echo "Expected 'Transpile ${REFERENCE_COMMIT}' but found '$(git log -1 --pretty=%B)'"
  exit 1
fi

# Read the version from the package.json, and check whether that corresponds to a pre-release
VERSION="$(jq -r .version contracts/package.json)"
if [[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  PRERELEASE="false"
elif [[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+-rc\.[0-9]+$ ]]; then
  PRERELEASE="true"
else
  echo "Invalid version"
  exit 1
fi

echo "is_prerelease=${PRERELEASE}" >> "$GITHUB_OUTPUT"
