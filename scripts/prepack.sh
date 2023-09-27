#!/usr/bin/env bash

set -euo pipefail
shopt -s globstar

# cross platform `mkdir -p`
mkdirp() {
  node -e "fs.mkdirSync('$1', { recursive: true })"
}

# cd to the root of the repo
cd "$(git rev-parse --show-toplevel)"

npm run clean

env COMPILE_MODE=production npm run compile

mkdirp build/contracts
cp artifacts/contracts/**/*.json build/contracts
rm build/contracts/*.dbg.json

node scripts/remove-ignored-artifacts.js

cp README.md contracts/

mkdirp contracts/build/contracts
cp -r build/contracts/*.json contracts/build/contracts
