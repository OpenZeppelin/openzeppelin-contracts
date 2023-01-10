#!/usr/bin/env bash

set -o errexit

scripts/release/format-changelog.js
scripts/release/synchronize-versions.js
scripts/release/update-comment.js

oz-docs update-version
