#!/usr/bin/env bash

set -o errexit

cmd="$1"

docsite="${DOCSITE:-https://github.com/OpenZeppelin/openzeppelin-docsite.git}"

if [ -d docsite ]; then
  pushd docsite
  git pull --ff-only "$docsite"
else
  git clone "$docsite" docsite
  pushd docsite
fi

npm install

export DOCS_PATH=../docs

npm run "$cmd"
