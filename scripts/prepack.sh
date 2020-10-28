#!/usr/bin/env bash

set -euo pipefail

node -e 'fs.mkdirSync("build/contracts", { recursive: true })'

cp artifacts/*.json build/contracts

node scripts/remove-ignored-artifacts.js
