#!/usr/bin/env bash

set -euo pipefail

gh release create "${GIT_TAG}" \
  --repo="${UPGRADEABLE_REPO}" \
  --title="${GIT_TAG}" \
  --target="${RELEASE_COMMIT}" \
  --notes="$(gh release view "${OLD_GIT_TAG}" --repo="${VANILLA_REPO}" --json body -q .body)" `# TODO: Update tag before merging` \
  --prerelease="${PRERELEASE}"
