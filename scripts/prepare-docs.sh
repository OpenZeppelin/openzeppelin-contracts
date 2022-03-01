#!/usr/bin/env bash

set -o errexit

OUTDIR=docs/modules/api/pages/

if [ ! -d node_modules ]; then
  npm ci
fi

rm -rf "$OUTDIR"

solidity-docgen \
  -t docs \
  -o "$OUTDIR" \
  -e contracts/mocks,contracts/examples \
  --output-structure readmes \
  --helpers ./docs/helpers.js \
  --solc-module ./scripts/prepare-docs-solc.js

rm -f "$OUTDIR"/token/*/presets.md

node scripts/gen-nav.js "$OUTDIR" > "$OUTDIR/../nav.adoc"
