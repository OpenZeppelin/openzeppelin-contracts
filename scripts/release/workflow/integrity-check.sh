#!/usr/bin/env bash

set -euo pipefail

CHECKSUMS="$RUNNER_TEMP/checksums.txt"

# Extract tarball content into a tmp directory
tar xf "$TARBALL" -C "$RUNNER_TEMP"

# Move to tmp directory and rename to contracts 
# so the shasum check matches the absolute paths
cd "$RUNNER_TEMP"
mv package contracts
cd contracts

# Checksum extracted package contracts
find . -type f -name "*.sol" | xargs shasum > "$CHECKSUMS"

# Back to initial directory
cd "$GITHUB_WORKSPACE/contracts"

# Check
shasum -c "$CHECKSUMS"
