#!/usr/bin/env bash

set -euo pipefail

PACKAGE_JSON_NAME="$(tar xfO "$TARBALL" package/package.json | jq -r .name)"
PACKAGE_JSON_VERSION="$(tar xfO "$TARBALL" package/package.json | jq -r .version)"

# Intentionally escape $ to avoid interpolation and writing the token to disk
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

# Actual publish
npm publish "$TARBALL" --tag "$TAG"

# Clean up tags
delete_tag() {
  npm dist-tag rm "$PACKAGE_JSON_NAME" "$1"
}

if [ "$TAG" = tmp ]; then
  delete_tag "$TAG"
elif [ "$TAG" = latest ]; then
  # Delete the next tag if it exists and is a prerelease for what is currently being published
  if npm dist-tag ls "$PACKAGE_JSON_NAME" | grep -q "next: $PACKAGE_JSON_VERSION"; then
    delete_tag next
  fi
fi
