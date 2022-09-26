#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20Harness.sol \
    --verify ERC20Harness:certora/specs/ERC20.spec \
    --solc solc \
    --optimistic_loop \
    $@