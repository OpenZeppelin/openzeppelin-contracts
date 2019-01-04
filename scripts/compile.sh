#!/usr/bin/env bash

# Configure to exit script as soon as a command fails.
set -o errexit

SOLC_05_DIR=solc-0.5

# Delete any previous build artifacts
rm -rf build/

# Create a subproject where 0.5.x compilation will take place
mkdir -p "$SOLC_05_DIR"

cd "$SOLC_05_DIR"
echo '{ "private": true }' > package.json
npm install --save-dev truffle@5.0.0

rm -rf contracts
ln --symbolic ../contracts contracts

# Delete any previous build artifacts
rm -rf build/

# Compile
echo "
module.exports = {
  compilers: {
    solc: {
      version: \"0.5.0\",
    },
  },
};
" > truffle-config.js

npx truffle compile

# Modify the paths in the artifacts to make it look as if they were built in the root
sed --in-place --expression "s/\/$SOLC_05_DIR//g" build/contracts/*.json

# Copy them back into the root
cd ..
cp --recursive "$SOLC_05_DIR"/build build
