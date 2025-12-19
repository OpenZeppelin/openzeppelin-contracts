#!/usr/bin/env bash

set -euo pipefail
cd lib/openzeppelin-contracts
REFERENCE_COMMIT="$(git rev-parse --short HEAD)"

cd ../..
if ! git log -1 --pretty=%B | grep -q "Transpile ${REFERENCE_COMMIT}"; then
  echo "Expected 'Transpile ${REFERENCE_COMMIT}' but found '$(git log -1 --pretty=%B)'"
  exit 1
fi

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
