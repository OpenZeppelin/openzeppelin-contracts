#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20WrapperHarness.sol certora/harnesses/ERC20PermitHarness.sol \
    --verify ERC20WrapperHarness:certora/specs/ERC20Wrapper.spec \
    --solc solc \
    --optimistic_loop \
    $@
