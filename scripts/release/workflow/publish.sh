#!/usr/bin/env bash

set -o errexit

publish() {
  cd contracts
  ## Intentionally escape \$ to avoid interpolation and to write the token to disk/
  echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc 
  npm publish $TARBALL
  cd ..
}

npx changeset tag
publish
git push --tags
