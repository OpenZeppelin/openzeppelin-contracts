#!/usr/bin/env bash

set -euo pipefail

CHECKSUMS="$RUNNER_TEMP/checksums.txt"
PACKAGE="$RUNNER_TEMP/package"

# Extract tarball content into a tmp directory
tar xf "$TARBALL" -C "$RUNNER_TEMP"

# Checksum extracted package contracts
find -s "$PACKAGE/contracts" -type f -exec shasum "{}" \; > "$CHECKSUMS"

# Remove the previously packed version
rm -rf "$PACKAGE/contracts"

# Replace with original source contracts
cp -r contracts "$PACKAGE/contracts" 

# Check
shasum -c "$CHECKSUMS"
