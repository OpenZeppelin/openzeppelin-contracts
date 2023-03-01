#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/AccessControlHarness.sol \
    --verify AccessControlHarness:certora/specs/AccessControl.spec \
    --optimistic_loop \
    $@
