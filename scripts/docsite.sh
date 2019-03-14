#!/usr/bin/env bash

set -o errexit

cmd="$1"

docsite_repo="${DOCSITE_REPO:-https://github.com/OpenZeppelin/openzeppelin-docsite.git}"

if [ -d docsite ]; then
  cd docsite
  git checkout next
  git pull --ff-only "$docsite_repo" next
  cd ..
else
  git clone --branch next "$docsite_repo" docsite
fi

npm run docgen

cd docsite

npm install

export DOCS_PATH=../docs # path relative to the docsite directory

npm run "$cmd"
