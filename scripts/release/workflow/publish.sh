#!/usr/bin/env bash

set -euo pipefail

PACKAGE_JSON_NAME="$(tar xfO "$TARBALL" package/package.json | jq -r .name)"
PACKAGE_JSON_VERSION="$(tar xfO "$TARBALL" package/package.json | jq -r .version)"

# Intentionally escape $ to avoid interpolation and writing the token to disk
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

# Actual publish
npm publish "$TARBALL" --tag "$TAG"

# CI can no longer remove dist-tags (OIDC publish tokens have no tag-write access).
# Surface the manual cleanup with a run annotation and a tracking issue.
notify_manual_tag_cleanup() {
  local tag="$1"
  local command="npm dist-tag rm $PACKAGE_JSON_NAME $tag"

  echo "::warning title=Manual npm tag cleanup required::$command"

  # Best-effort: a failed issue-create must not fail the job after a successful publish
  gh issue create \
    --title "Remove npm dist-tag \`$tag\` after $PACKAGE_JSON_NAME@$PACKAGE_JSON_VERSION release" \
    --body "$(printf 'CI no longer has npm tag-write access, so the `%s` dist-tag must be removed manually:\n\n```sh\n%s\n```\n' "$tag" "$command")" \
    || true
}

if [ "$TAG" = tmp ]; then
  notify_manual_tag_cleanup "$TAG"
elif [ "$TAG" = latest ]; then
  # The next tag needs cleanup if it exists and is a prerelease for what is currently being published
  if npm dist-tag ls "$PACKAGE_JSON_NAME" | grep -q "next: $PACKAGE_JSON_VERSION"; then
    notify_manual_tag_cleanup next
  fi
fi
