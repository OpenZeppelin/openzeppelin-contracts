#!/usr/bin/env sh

if [ "$SOLC_NIGHTLY" = true ]; then
  docker pull ethereum/solc:nightly
fi

# Necessary to avoid an error in Truffle
rm -rf build/contracts

truffle compile
