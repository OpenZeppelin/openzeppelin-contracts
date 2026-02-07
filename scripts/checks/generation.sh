#!/usr/bin/env bash

set -euo pipefail

npm run generate
git diff -R --exit-code
