#!/usr/bin/env bash

set -euo pipefail

# Intentionally escape $ to avoid interpolation and writing the token to disk
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

# Actual publish
npm publish "$TARBALL" --tag "$TAG"

if [ "$TAG" = "tmp" ]; then
  # Remove tmp tag
  PACKAGE_JSON_NAME="$(tar xfO "$TARBALL" package/package.json | jq -r .name)"
  npm dist-tag rm "$PACKAGE_JSON_NAME" "$TAG"
fi
