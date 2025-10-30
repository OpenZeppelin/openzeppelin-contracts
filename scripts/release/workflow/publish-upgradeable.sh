#!/usr/bin/env bash

cd $UPGRADEABLE_DIR

if ! git log -1 --pretty=%B | grep -q "Transpile ${VANILLA_COMMIT}"; then
  echo "Expected 'Transpile ${VANILLA_COMMIT}' but found '$(git log -1 --pretty=%B)'"
  exit 1
fi
VERSION="$(jq -r .version contracts/package.json)"
GIT_TAG="v${VERSION}"
NPM_TAG="tmp"
ADDITIONAL_OPTION_IF_PRERELEASE="--prerelease"
if [[ "${GIT_TAG}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  NPM_TAG="dev"
  ADDITIONAL_OPTION_IF_PRERELEASE=""
elif [[ "${GIT_TAG}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+-rc.[0-9]+$ ]]; then
  NPM_TAG="next"
fi
echo "additional_option_if_prerelease=${ADDITIONAL_OPTION_IF_PRERELEASE}" >> "$GITHUB_OUTPUT"
### [START BLOCK] TODO: Remove block before merging
TIMESTAMPED_VERSION="${VERSION}-$(date +%s)"
echo "OLD_GIT_TAG=${GIT_TAG}" >> "$GITHUB_ENV"
GIT_TAG="${GIT_TAG}-$(date +%s)" # incremental git tag for testing
sed -i'' -e 's/openzeppelin\/contracts-upgradeable/james-toussaint\/contracts-upgradeable/g' contracts/package.json # custom scope for testing
sed -i'' -e "s/${VERSION}/${TIMESTAMPED_VERSION}/g" contracts/package.json && head contracts/package.json # incremental npm package version for testing
### [END BLOCK]
sed -i'' -e 's/OpenZeppelin\/openzeppelin-contracts-upgradeable/james-toussaint\/openzeppelin-contracts/g' contracts/package.json # repository.url for provenance (TODO: Update and try keep upgradeable url)
git tag -m {,}"${GIT_TAG}"
CI=true git push origin tag "${GIT_TAG}"
npm ci
cd "contracts/"
npm publish --tag "${NPM_TAG}"
echo "git_tag=${GIT_TAG}" >> "$GITHUB_OUTPUT"
