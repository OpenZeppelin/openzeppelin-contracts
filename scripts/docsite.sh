#!/usr/bin/env bash

if [ "$1" != "build" -a "$1" != "start" ];then
  echo "usage: npm run docsite (build|start)" >&2
  exit 1
fi

set -o errexit

if [ ! -d openzeppelin-docs ]; then
  git clone https://github.com/frangio/openzeppelin-docs.git
fi

git -C openzeppelin-docs pull -q

if [ "$1" = "build" ]; then
  npm run prepare-docs
  cd docs
  env DISABLE_PREPARE_DOCS= node ../openzeppelin-docs/build-local.js

elif [ "$1" = "start" ]; then
  npx concurrently \
    'nodemon --delay 1 -e "*" -w contracts -w "docs/*.hbs" -x npm run prepare-docs' \
    'cd docs; env DISABLE_PREPARE_DOCS= nodemon --delay 1 -e adoc,yml ../openzeppelin-docs/build-local.js' \
    'http-server -c-1 openzeppelin-docs/build/site'
fi
