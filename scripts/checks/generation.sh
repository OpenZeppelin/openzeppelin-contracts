#!/usr/bin/env bash

set -euo pipefail

npm run generate
git diff --exit-code
