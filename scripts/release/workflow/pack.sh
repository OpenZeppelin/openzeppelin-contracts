#!/usr/bin/env bash

set -euo pipefail

dist_tag() {
  PACKAGE_JSON_NAME="$(jq -r .name ./package.json)"
  LATEST_NPM_VERSION="$(npm info "$PACKAGE_JSON_NAME" version)"
  PACKAGE_JSON_VERSION="$(jq -r .version ./package.json)"
  
  if [ "$PRERELEASE" = "true" ]; then
    echo "next"
  elif npx semver -r ">$LATEST_NPM_VERSION" "$PACKAGE_JSON_VERSION" > /dev/null; then
    echo "latest"
  else
    # This is a patch for an older version
    # npm can't publish without a tag
    echo "tmp"
  fi
}

cd contracts
TARBALL="$(npm pack | tee /dev/stderr | tail -1)"
echo "tarball_name=$TARBALL" >> $GITHUB_OUTPUT
echo "tarball=$(pwd)/$TARBALL" >> $GITHUB_OUTPUT
echo "tag=$(dist_tag)" >> $GITHUB_OUTPUT
cd ..
