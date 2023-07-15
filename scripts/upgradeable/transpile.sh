#!/usr/bin/env bash

set -euo pipefail -x

DIRNAME="$(dirname -- "${BASH_SOURCE[0]}")"

bash "$DIRNAME/patch-apply.sh"

npm run clean
npm run compile

build_info=($(jq -r '.input.sources | keys | if any(test("^contracts/mocks/.*\\bunreachable\\b")) then empty else input_filename end' artifacts/build-info/*))
build_info_num=${#build_info[@]}

if [ $build_info_num -ne 1 ]; then
  echo "found $build_info_num relevant build info files but expected just 1"
  exit 1
fi

# -D: delete original and excluded files
# -b: use this build info file
# -i: use included Initializable
# -x: exclude proxy-related contracts with a few exceptions
# -p: emit public initializer
npx @openzeppelin/upgrade-safe-transpiler@latest -D \
  -b "$build_info" \
  -i contracts/proxy/utils/Initializable.sol \
  -x 'contracts-exposed/**/*' \
  -x 'contracts/proxy/**/*' \
  -x '!contracts/proxy/Clones.sol' \
  -x '!contracts/proxy/ERC1967/ERC1967Storage.sol' \
  -x '!contracts/proxy/ERC1967/ERC1967Utils.sol' \
  -x '!contracts/proxy/utils/UUPSUpgradeable.sol' \
  -x '!contracts/proxy/beacon/IBeacon.sol' \
  -p 'contracts/**/presets/**/*'

# delete compilation artifacts of vanilla code
npm run clean
