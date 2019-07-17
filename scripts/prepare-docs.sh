#!/usr/bin/env bash

OUTDIR=docs/modules/api/pages/

rm -rf "$OUTDIR"
solidity-docgen -t docs -o "$OUTDIR" -e contracts/mocks,contracts/examples

gen-nav() {
  echo '.API'
  find "$OUTDIR" -type f | sed -Ee "s:$OUTDIR(.+):* xref\:\1[]:"
}

gen-nav > "$OUTDIR/../nav.adoc"
