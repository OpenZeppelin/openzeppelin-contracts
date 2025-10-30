#!/usr/bin/env bash

gh release create "${GIT_TAG}" \
  --repo="${UPGRADEABLE_REPO}" \
  --title="${GIT_TAG}" \
  --notes="$(gh release view "${OLD_GIT_TAG}" --repo="${VANILLA_REPO}" --json body -q .body)" `# TODO: Update tag before merging` \
  "${ADDITIONAL_OPTION_IF_PRERELEASE}"
