#!/usr/bin/env bash

set -euo pipefail

npx changeset pre exit rc
git add .
git commit -m "Exit release candidate"
git push origin
