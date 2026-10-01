#!/usr/bin/env bash

set -euo pipefail

SOURCE_DIR=contracts/mocks/ExposedStale
EXPOSED_DIR=contracts-exposed/$SOURCE_DIR

cleanup() { rm -rf "$SOURCE_DIR" "$EXPOSED_DIR"; }
trap cleanup EXIT

write_contract() {
  mkdir -p "$SOURCE_DIR"
  printf '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract %s {}\n' "$2" > "$SOURCE_DIR/$1.sol"
}

assert_wrappers() {
  actual=$( (ls "$EXPOSED_DIR" 2>/dev/null || true) | tr '\n' ' ')
  if [ "$actual" != "$1" ]; then
    echo "Expected exposed wrappers [$1] but found [$actual]"
    exit 1
  fi
}

echo "Wrapper is generated"
write_contract Original Original
npx hardhat build
assert_wrappers "Original.sol "

echo "Wrapper is removed when its source is deleted"
rm "$SOURCE_DIR/Original.sol"
npx hardhat build
assert_wrappers ""

echo "Wrapper is replaced when its source is renamed"
write_contract Before Before
npx hardhat build
mv "$SOURCE_DIR/Before.sol" "$SOURCE_DIR/After.sol"
sed -i.bak 's/contract Before/contract After/' "$SOURCE_DIR/After.sol" && rm "$SOURCE_DIR/After.sol.bak"
npx hardhat build
assert_wrappers "After.sol "

echo "Wrapper is regenerated when it is deleted by hand"
rm "$EXPOSED_DIR/After.sol"
npx hardhat build
assert_wrappers "After.sol "
