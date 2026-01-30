#!/usr/bin/env bash

set -euo pipefail -x
shopt -s extglob

VERSION="$(jq -r .version contracts/package.json)"
DIRNAME="$(dirname -- "${BASH_SOURCE[0]}")"

bash "$DIRNAME/patch-apply.sh"
sed -i'' -e "s/<package-version>/$VERSION/g" "contracts/package.json"
git add contracts/package.json

npm run clean
npm run compile -- --no-tests

build_info=($(jq -r '.input.sources | keys | if any(test("^contracts/mocks/.*\\bunreachable\\b")) then empty else input_filename end' artifacts/build-info/!(*.output).json))
build_info_num=${#build_info[@]}

if [ $build_info_num -ne 1 ]; then
  echo "found $build_info_num relevant build info files but expected just 1"
  exit 1
fi

paths="$(node <<'EOF'
  import { config } from "hardhat";
  const { paths } = config;
  paths.sources = paths.sources.solidity[0];
  console.log(JSON.stringify(paths))
EOF
)"

# -D: delete original and excluded files
# -b: use this build info file
# -i: use included Initializable
# -x: exclude some proxy-related contracts
# -p: emit public initializer
# -n: use namespaces
# -N: exclude from namespaces transformation
# -q: partial transpilation using @openzeppelin/contracts as peer project
npx @openzeppelin/upgrade-safe-transpiler -D \
  --paths "$paths" \
  -b "$build_info" \
  -i project/contracts/proxy/utils/Initializable.sol \
  -x 'project/contracts-exposed/**/*' \
  -x 'project/contracts/mocks/**/*Proxy*.sol' \
  -x 'project/contracts/proxy/**/*Proxy*.sol' \
  -x 'project/contracts/proxy/beacon/UpgradeableBeacon.sol' \
  -p 'project/contracts/access/manager/AccessManager.sol' \
  -p 'project/contracts/finance/VestingWallet.sol' \
  -p 'project/contracts/governance/TimelockController.sol' \
  -p 'project/contracts/metatx/ERC2771Forwarder.sol' \
  -n \
  -N 'project/contracts/mocks/**/*' \
  -q '@openzeppelin/'

# create alias to Initializable and UUPSUpgradeable
cp $DIRNAME/alias/*.sol contracts/proxy/utils/.

# delete compilation artifacts of vanilla code
npm run clean
