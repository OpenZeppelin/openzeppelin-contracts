#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20PermitHarness.sol \
    --verify ERC20PermitHarness:certora/specs/ERC20.spec \
    --solc solc \
    --optimistic_loop \
    $@