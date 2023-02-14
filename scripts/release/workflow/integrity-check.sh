#!/usr/bin/env bash

set -euo pipefail

CHECKSUMS="$RUNNER_TEMP/checksums.txt"
PACKAGE="$RUNNER_TEMP/package"

# Extract tarball content into a tmp directory
tar xf "$TARBALL" -C "$RUNNER_TEMP"

cd "$PACKAGE/contracts"

# Checksum extracted package contracts
find . -type f -name "*.sol" -exec shasum "{}" \; > "$CHECKSUMS"

# Back to initial directory
cd "$GITHUB_WORKSPACE/contracts"

# Check
shasum -c "$CHECKSUMS"
