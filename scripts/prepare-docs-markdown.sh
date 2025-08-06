#!/usr/bin/env bash

set -euo pipefail
shopt -s globstar

OUTDIR="$(node -p 'require("./docs/config-markdown.js").outputDir')"

if [ ! -d node_modules ]; then
  npm ci
fi

rm -rf "$OUTDIR"

# Generate markdown docs using the markdown config
npx hardhat docgen

# Copy examples and adjust imports (same as original but to markdown output dir)
examples_source_dir="contracts/mocks/docs"
examples_target_dir="docs/modules/api/examples"

for f in "$examples_source_dir"/**/*.sol; do
  name="${f/#"$examples_source_dir"/}"
  mkdir -p "$examples_target_dir/$(dirname "$name")"
  sed -Ee '/^import/s|"(\.\./)+|"@openzeppelin/contracts/|' "$f" > "$examples_target_dir/$name"
done

echo "Markdown documentation generated in $OUTDIR"
