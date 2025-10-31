#!/usr/bin/env bash

set -euo pipefail

eval $GO_TO_UPGRADEABLE_DIR
sed -i'' -e 's/OpenZeppelin\/openzeppelin-contracts-upgradeable/james-toussaint\/openzeppelin-contracts/g' contracts/package.json # repository.url for provenance (TODO: Update and try keep upgradeable url)
npm ci
cd "contracts/"
npm publish --tag "${NPM_TAG}"
