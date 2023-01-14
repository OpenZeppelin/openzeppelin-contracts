#!/usr/bin/env bash

set -o errexit

if [ $PRERELEASE != "false" ]; then
  npx changeset pre exit rc
  git add .
  git commit -m "Exit release candidate"
  git push --all origin
fi
