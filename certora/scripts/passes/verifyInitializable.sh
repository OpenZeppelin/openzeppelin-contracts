#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/InitializableComplexHarness.sol \
    --verify InitializableComplexHarness:certora/specs/Initializable.spec \
    --optimistic_loop \
    --loop_iter 3 \
    $@
