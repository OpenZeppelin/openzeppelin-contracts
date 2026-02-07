#!/usr/bin/env bash

set -euo pipefail

CHECKSUMS="$RUNNER_TEMP/checksums.txt"

# Extract tarball content into a tmp directory
tar xf "$TARBALL" -C "$RUNNER_TEMP"

# Move to extracted directory
cd "$RUNNER_TEMP/package"

# Checksum all Solidity files
find . -type f -name "*.sol" | xargs shasum > "$CHECKSUMS"

# Back to directory with git contents
cd "$GITHUB_WORKSPACE/contracts"

# Check against tarball contents
shasum -c "$CHECKSUMS"
