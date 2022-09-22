#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC1155/ERC1155PausableHarness.sol \
    --verify ERC1155PausableHarness:certora/specs/ERC1155Pausable.spec \
    --solc solc \
    --optimistic_loop \
    --loop_iter 3 \
    --msg "ERC1155 Pausable verification all rules"
