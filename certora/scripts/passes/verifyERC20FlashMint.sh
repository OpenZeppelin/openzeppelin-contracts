#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20FlashMintHarness.sol \
    certora/harnesses/IERC3156FlashBorrowerHarness.sol \
    --verify ERC20FlashMintHarness:certora/specs/ERC20FlashMint.spec \
    --optimistic_loop \
    $@
