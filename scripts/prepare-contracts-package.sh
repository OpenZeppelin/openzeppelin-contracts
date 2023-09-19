#!/usr/bin/env bash

# cd to the root of the repo
cd "$(git rev-parse --show-toplevel)"

# avoids re-compilation during publishing of both packages
if [[ ! -v ALREADY_COMPILED ]]; then
  npm run clean
  npm run prepare
  npm run prepack
fi

cp README.md contracts/
mkdir contracts/build contracts/build/contracts
cp -r build/contracts/*.json contracts/build/contracts
