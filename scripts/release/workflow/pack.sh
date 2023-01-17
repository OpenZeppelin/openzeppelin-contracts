#!/usr/bin/env bash

set -euo pipefail

cd contracts
npm pack
TARBALL=$(ls | grep "$GITHUB_REPOSITORY-.*.tgz")
echo "tarball=$TARBALL >> $GITHUB_OUTPUT
cd ..
