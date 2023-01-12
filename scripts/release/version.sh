#!/usr/bin/env bash

set -o errexit

npx changeset version

scripts/release/format-changelog.js
scripts/release/synchronize-versions.js
scripts/release/update-comment.js

oz-docs update-version
