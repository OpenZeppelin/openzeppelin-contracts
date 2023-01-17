#!/usr/bin/env bash

set -euo pipefail

package_name() {
  echo $(node --print --eval "require('./package.json').name")
}

latest_npm_version() { 
  echo $(npm info "$package_name" version)
}

package_json_version() {
  echo $(node --print --eval "require('./package.json').name")
}

dist_tag() {
  if [ "$PRERELEASE" = "true" ]; then
    echo "next"
  else
    if [ `npx semver -r ">$package_json_version" $latest_npm_version` = "" ]; then
      echo "latest"
    else
      # This is a patch for an older version
      # npm can't publish without a tag
      echo "tmp"
    fi
  fi
}

publish() {
  cd contracts

  ## Intentionally escape $ to avoid interpolation and to write the token to disk
  echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

  # Actual publish
  npm publish "$TARBALL" --tag "$dist_tag"

  if [ "$dist_tag" = "tmp" ]; then
    # Remove tmp tag
    npm dist-tag rm "$package_name" "$dist_tag"
  fi

  cd ..
}

npx changeset tag
publish
git push --tags
