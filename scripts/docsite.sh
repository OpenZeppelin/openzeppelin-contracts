#!/usr/bin/env bash

set -o errexit

cmd="$1"

docsite="${DOCSITE:-https://github.com/OpenZeppelin/openzeppelin-docsite.git}"

if [ -d docsite ]; then
  cd docsite
  git pull --ff-only "$docsite"
else
  git clone "$docsite" docsite
  cd docsite
fi

npm install

export DOCS_PATH=../docs

npm run "$cmd"
