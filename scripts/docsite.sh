#!/usr/bin/env bash

set -o errexit

cmd="$1"

docsite="${DOCSITE:-https://github.com/OpenZeppelin/openzeppelin-docsite.git}"

if [ -d docsite ]; then
  cd docsite
  git checkout next
  git pull --ff-only "$docsite" next
  cd ..
else
  git clone --branch next "$docsite" docsite
fi

npm run docgen

cd docsite

npm install

export DOCS_PATH=../docs

npm run "$cmd"
