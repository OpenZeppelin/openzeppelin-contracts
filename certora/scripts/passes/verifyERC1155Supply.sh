#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC1155/ERC1155SupplyHarness.sol \
    --verify ERC1155SupplyHarness:certora/specs/ERC1155Supply.spec \
    --optimistic_loop \
    --loop_iter 3 \
    $@
