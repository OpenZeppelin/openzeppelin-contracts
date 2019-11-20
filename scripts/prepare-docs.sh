#!/usr/bin/env bash

OUTDIR=docs/modules/api/pages/

npm ci

rm -rf "$OUTDIR"
solidity-docgen -t docs -o "$OUTDIR" -e contracts/mocks,contracts/examples
node scripts/gen-nav.js "$OUTDIR" > "$OUTDIR/../nav.adoc"
