#!/usr/bin/env bash

set -euo pipefail

OUTDIR="$(node -p 'require("./docs/config.js").outputDir')"

if [ ! -d node_modules ]; then
  npm ci
fi

rm -rf "$OUTDIR"

hardhat docgen

# copy examples and adjust imports
examples_dir="docs/modules/api/examples"
mkdir -p "$examples_dir"
for f in contracts/mocks/docs/*.sol; do
  name="$(basename "$f")"
  sed -e '/^import/s|\.\./\.\./|@openzeppelin/contracts/|' "$f" > "docs/modules/api/examples/$name"
done

node scripts/gen-nav.js "$OUTDIR" > "$OUTDIR/../nav.adoc"
