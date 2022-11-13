#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/Ownable2StepHarness.sol \
    --verify Ownable2StepHarness:certora/specs/Ownable2Step.spec \
    --solc solc \
    --optimistic_loop \
    $@