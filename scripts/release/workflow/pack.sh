#!/usr/bin/env bash

set -euo pipefail

latest_npm_version() { 
  echo "$(npm info "$(package_json_name)" version)"
}

package_json_name() {
  echo "$(node --print --eval "require('./contracts/package.json').name")"
}

package_json_version() {
  echo "$(node --print --eval "require('./contracts/package.json').version")"
}

dist_tag() {
  if [ "$PRERELEASE" = "true" ]; then
    echo "next"
  elif [ "$(npx semver -r ">$(package_json_version)" "$(latest_npm_version)")" = "" ]; then
    echo "latest"
  else
    # This is a patch for an older version
    # npm can't publish without a tag
    echo "tmp"
  fi
}

cd contracts
npm pack
TARBALL="$(npm pack)"
echo "tarball=./contracts/$TARBALL" >> $GITHUB_OUTPUT
echo "tag=$(dist_tag)" >> $GITHUB_OUTPUT
cd ..
