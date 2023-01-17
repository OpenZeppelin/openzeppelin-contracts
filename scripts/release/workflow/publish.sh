#!/usr/bin/env bash

set -euo pipefail

package_json_name() {
  echo "$(node --print --eval "require('./package.json').name")"
}

publish() {
  # Intentionally escape $ to avoid interpolation and to write the token to disk
  echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

  # Actual publish
  npm publish "$TARBALL" --tag "$TAG"

  if [ "$TAG" = "tmp" ]; then
    # Remove tmp tag
    npm dist-tag rm "$(package_json_name)" "$TAG"
  fi
}

npx changeset tag
publish
git push --tags
