#!/usr/bin/env bash

# usage: npm run docsite

set -o errexit

if [ ! -d openzeppelin-docs ]; then
  git clone https://github.com/frangio/openzeppelin-docs.git
fi

git -C openzeppelin-docs pull

npx concurrently \
  'nodemon --delay 1 -e "*" -w contracts -w "docs/*.hbs" -x npm run prepare-docs' \
  'cd docs; env DISABLE_PREPARE_DOCS= nodemon --delay 1 -e adoc,yml ../openzeppelin-docs/build-local.js' \
  'http-server -c-1 openzeppelin-docs/build/site'
