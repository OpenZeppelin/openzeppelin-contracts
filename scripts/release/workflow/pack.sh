#!/usr/bin/env bash

set -o errexit

cd contracts
npm pack
TARBALL=$(ls | grep "$GITHUB_REPOSITORY-.*.tgz")
echo "tarball=$TARBALL >> $GITHUB_OUTPUT
cd ..
