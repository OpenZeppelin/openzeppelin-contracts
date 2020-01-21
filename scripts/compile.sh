#!/usr/bin/env sh

if [ "$SOLC_NIGHTLY" = true ]; then
  docker pull ethereum/solc:nightly
fi

export OPENZEPPELIN_NON_INTERACTIVE=true

npx oz compile
