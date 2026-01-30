#!/usr/bin/env bash

set -euo pipefail -x
shopt -s extglob

VERSION="$(jq -r .version contracts/package.json)"
DIRNAME="$(dirname -- "${BASH_SOURCE[0]}")"

bash "$DIRNAME/patch-apply.sh"
sed -i'' -e "s/<package-version>/$VERSION/g" "contracts/package.json"
git add contracts/package.json

npx hardhat transpile

# create alias to Initializable and UUPSUpgradeable
cp $DIRNAME/alias/*.sol contracts/proxy/utils/.

# delete compilation artifacts of vanilla code
npm run clean
