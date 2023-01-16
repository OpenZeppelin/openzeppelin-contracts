#!/usr/bin/env bash

set -o errexit

# Tag
npx changeset tag

# Publish to npm
cd contracts
## Intentionally escape \$ to avoid interpolation and to write the token to disk/
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc 
npm publish
cd ..

# Push tags
git push --tags
