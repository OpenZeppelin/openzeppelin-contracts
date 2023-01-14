#!/usr/bin/env bash

set -o errexit

# Tag
npx changeset tag

# Publish to npm
cd contracts
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > $HOME/.npmrc
npm publish
cd ..

# Push tags
git push --tags
