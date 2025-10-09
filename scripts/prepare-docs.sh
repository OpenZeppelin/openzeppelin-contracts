#!/usr/bin/env bash

set -euo pipefail
shopt -s globstar

OUTDIR="$(node -p 'require("./docs/config.js").outputDir')"

if [ ! -d node_modules ]; then
  npm ci
fi

rm -rf "$OUTDIR"

hardhat docgen

# copy examples and adjust imports
examples_source_dir="contracts/mocks/docs"
examples_target_dir="docs/modules/api/examples"

for f in "$examples_source_dir"/**/*.sol; do
  name="${f/#"$examples_source_dir"/}"
  mkdir -p "$examples_target_dir/$(dirname "$name")"
  sed -Ee '/^import/s|"(\.\./)+|"@openzeppelin/contracts/|' "$f" > "$examples_target_dir/$name"
done

node scripts/gen-nav.js "$OUTDIR" > "$OUTDIR/../nav.adoc"
