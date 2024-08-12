#!/usr/bin/env bash

set -euo pipefail

if git status &>/dev/null; then git config core.hooksPath .githooks; fi
