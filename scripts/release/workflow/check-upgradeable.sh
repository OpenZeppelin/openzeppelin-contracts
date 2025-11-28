#!/usr/bin/env bash

set -euo pipefail

echo "release_commit=$(git log -1 --pretty=%H)" >> "$GITHUB_OUTPUT"
if ! git log -1 --pretty=%B | grep -q "Transpile ${VANILLA_COMMIT}"; then
  echo "Expected 'Transpile ${VANILLA_COMMIT}' but found '$(git log -1 --pretty=%B)'"
  exit 1
fi
VERSION="$(jq -r .version contracts/package.json)"
GIT_TAG="v${VERSION}"
NPM_TAG="tmp"
PRERELEASE="true"
if [[ "${GIT_TAG}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  NPM_TAG="dev"
  PRERELEASE="false"
elif [[ "${GIT_TAG}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+-rc.[0-9]+$ ]]; then
  NPM_TAG="next"
fi
echo "prerelease=${PRERELEASE}" >> "$GITHUB_OUTPUT"
echo "npm_tag=${NPM_TAG}" >> "$GITHUB_OUTPUT"
### [START BLOCK] TODO: Remove block before merging
TIMESTAMPED_VERSION="${VERSION}-$(date +%s)"
echo "OLD_GIT_TAG=${GIT_TAG}" >> "$GITHUB_ENV"
GIT_TAG="${GIT_TAG}-$(date +%s)" # incremental git tag for testing
sed -i'' -e 's/openzeppelin\/contracts-upgradeable/james-toussaint\/contracts-upgradeable/g' contracts/package.json # custom scope for testing
sed -i'' -e "s/${VERSION}/${TIMESTAMPED_VERSION}/g" contracts/package.json && head contracts/package.json # incremental npm package version for testing
### [END BLOCK]
echo "git_tag=${GIT_TAG}" >> "$GITHUB_OUTPUT"
