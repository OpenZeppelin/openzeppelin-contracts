#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

log() {
  # Print to stderr to prevent this from being 'returned'
  echo "$@" > /dev/stderr
}

current_version() {
  echo "v$(node --print --eval "require('./package.json').version")"
}

current_release_branch() {
  v="$(current_version)"
  echo "release-${v%%-rc.*}"
}

assert_current_branch() {
  current_branch="$(git symbolic-ref --short HEAD)"
  expected_branch="$1"
  if [[ "$current_branch" != "$expected_branch" ]]; then
    log "Current branch '$current_branch' is not '$expected_branch'"
    exit 1
  fi
}

push_release_branch_and_tag() {
  git push upstream "$(current_release_branch)" "$(current_version)"
}

push_and_publish() {
  dist_tag="$1"

  log "Pushing release branch and tags to upstream"
  push_release_branch_and_tag

  log "Publishing package on npm"
  npm publish --tag "$dist_tag" --otp "$(prompt_otp)"

  if [[ "$dist_tag" == "latest" ]]; then
    npm dist-tag rm --otp "$(prompt_otp)" openzeppelin-solidity next
  fi
}

prompt_otp() {
  log -n "Enter npm 2FA token: "
  read -r otp
  echo "$otp"
}

environment_check() {
  if ! git remote get-url upstream &> /dev/null; then
    log "No 'upstream' remote found"
    exit 1
  fi

  if npm whoami &> /dev/null; then
    log "Will publish as '$(npm whoami)'"
  else
    log "Not logged in into npm, run 'npm login' first"
    exit 1
  fi
}

environment_check

if [[ "$*" == "start minor" ]]; then
  log "Creating new minor pre-release"

  assert_current_branch master

  # Create temporary release branch
  git checkout -b release-temp

  # This bumps minor and adds rc suffix, commits the changes, and tags the commit
  npm version preminor --preid=rc

  # Rename the release branch
  git branch --move "$(current_release_branch)"

  push_and_publish next

elif [[ "$*" == "rc" ]]; then
  log "Bumping pre-release"

  assert_current_branch "$(current_release_branch)"

  # Bumps rc number, commits and tags
  npm version prelease

  push_and_publish next

elif [[ "$*" == "final" ]]; then
  # Update changelog release date, remove rc suffix, tag, push to git, publish in npm, remove next dist-tag
  log "Creating final release"

  assert_current_branch "$(current_release_branch)"

  # This will remove the -rc suffix from the version
  npm version patch

  push_release_branch_and_tag

  push_and_publish latest

  log "Remember to merge the release branch into master and push upstream"

else
  log "Unknown command: '$*'"
  exit 1
fi
