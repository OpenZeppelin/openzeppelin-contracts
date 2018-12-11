#!/usr/bin/env bash

# Configure to exit script as soon as a command fails.
set -o errexit

# Clean the existing build directory.
rm -rf build

# Create a temporary directory to place ignored files (e.g. examples).
tmp_dir="$(mktemp -dp.)"

# Move the ignored files to the temporary directory.
while IFS="" read -r ignored
do
  mv "contracts/$ignored" "$tmp_dir"
done < contracts/.npmignore

# Compile everything else.
node_modules/.bin/truffle compile

# Return ignored files to their place.
mv "$tmp_dir/"* contracts/

# Delete the temporary directory.
rmdir "$tmp_dir"
