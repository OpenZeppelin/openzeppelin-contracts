#!/usr/bin/env bash

set -euo pipefail

npm run generate
git diff --quiet --exit-code
