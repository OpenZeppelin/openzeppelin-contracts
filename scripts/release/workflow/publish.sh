#!/usr/bin/env bash

set -euo pipefail

PACKAGE_JSON_NAME="$(tar xfO "$TARBALL" package/package.json | jq -r .name)"
PACKAGE_JSON_VERSION="$(tar xfO "$TARBALL" package/package.json | jq -r .version)"

# Actual publish
npm publish "$TARBALL" --tag "$TAG"

# CI can no longer remove dist-tags (OIDC publish tokens have no tag-write access).
# A dedicated npm token is not worth it: they expire, and the back-patch releases that
# need this cleanup are rare enough that the token would almost certainly be expired by
# the time one happens. Surface the manual cleanup with a run annotation and an issue.
notify_manual_tag_cleanup() {
  local tag="$1"
  local command="npm dist-tag rm $PACKAGE_JSON_NAME $tag"

  echo "::warning title=Manual npm tag cleanup required::$command"

  # Best-effort: a failed issue-create must not fail the job after a successful publish
  local url
  url="$(gh issue create \
    --title "Remove npm dist-tag \`$tag\` after $PACKAGE_JSON_NAME@$PACKAGE_JSON_VERSION release" \
    --body "$(printf 'CI no longer has npm tag-write access, so the `%s` dist-tag must be removed manually:\n\n```sh\n%s\n```\n' "$tag" "$command")" \
    || true)"

  # Best-effort assign the human who triggered the release (bot/invalid actor -> silently skipped).
  if [ -n "$url" ] && [ -n "${GITHUB_TRIGGERING_ACTOR:-}" ]; then
    gh issue edit "$url" --add-assignee "$GITHUB_TRIGGERING_ACTOR" || true
  fi
}

if [ "$TAG" = tmp ]; then
  notify_manual_tag_cleanup "$TAG"
elif [ "$TAG" = latest ]; then
  # The next tag needs cleanup if it exists and is a prerelease for what is currently being published
  if npm dist-tag ls "$PACKAGE_JSON_NAME" | grep -q "next: $PACKAGE_JSON_VERSION"; then
    notify_manual_tag_cleanup next
  fi
fi
