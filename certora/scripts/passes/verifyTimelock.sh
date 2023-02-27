#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/TimelockControllerHarness.sol certora/harnesses/AccessControlHarness.sol \
    --verify TimelockControllerHarness:certora/specs/TimelockController.spec \
    --optimistic_loop \
    --loop_iter 3 \
    $@
#    --settings -byteMapHashingPrecision=32 \
