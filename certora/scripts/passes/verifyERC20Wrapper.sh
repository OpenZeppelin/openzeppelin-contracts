#!/usr/bin/env bash

set -euxo pipefail

    # --link ERC20WrapperHarness:underlying=DummyERC20A \
certoraRun \
    certora/harnesses/ERC20WrapperHarness.sol certora/helpers/DummyERC20A.sol certora/helpers/DummyERC20B.sol \
    --verify ERC20WrapperHarness:certora/specs/ERC20Wrapper.spec \
    --solc solc \
    --optimistic_loop \
    $@
