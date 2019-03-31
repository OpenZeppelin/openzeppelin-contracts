#!/usr/bin/env bash

# usage: npm run docsite [build|start]

set -o errexit

npm run docgen
npx openzeppelin-docsite-run "$1"
