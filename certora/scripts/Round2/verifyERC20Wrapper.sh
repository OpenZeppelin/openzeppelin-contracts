#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20WrapperHarness.sol certora/helpers/DummyERC20A.sol certora/helpers/DummyERC20B.sol \
    --verify ERC20WrapperHarness:certora/specs/ERC20Wrapper.spec \
    --solc solc \
    --optimistic_loop \
    --msg "ERC20Wrapper verification"
