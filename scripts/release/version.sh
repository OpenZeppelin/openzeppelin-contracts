#!/usr/bin/env bash

set -o errexit

scripts/release/update-changelog-release-date.js
scripts/release/update-ethpm-version.js

cd contracts

# forward the arguments to npm version by taking
# them from the npm_config_argv env variable
args="$(node -pe 'JSON.parse(process.argv[1]).cooked.slice(1).join(" ")' "$npm_config_argv")"

npm version --no-git-tag-version $args > /dev/null
git add package.json
