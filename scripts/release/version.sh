#!/usr/bin/env bash

set -o errexit

scripts/release/update-changelog-release-date.js
scripts/release/synchronize-versions.js
