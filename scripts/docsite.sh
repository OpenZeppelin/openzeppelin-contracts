#!/usr/bin/env bash

# usage: npm run docsite [build|start]

set -o errexit

npm run docgen

if [ "$1" = start ]; then
  npx concurrently -n docgen,docsite --no-color \
    'nodemon -C -w contracts -e sol,md -x npm run docgen' \
    'openzeppelin-docsite-run start'
else
  npx openzeppelin-docsite-run "$1"
fi
