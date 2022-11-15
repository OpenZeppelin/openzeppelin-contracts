#!/usr/bin/env bash

set -euxo pipefail

# Changed: GovernorBasicHarness missing
certoraRun \
    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/GovernorHarness.sol \
    --verify GovernorHarness:certora/specs/GovernorCountingSimple.spec \
    --link GovernorHarness:token=ERC20VotesHarness \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    $@
