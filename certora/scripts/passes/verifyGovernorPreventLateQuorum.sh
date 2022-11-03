#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/GovernorFullHarness.sol \
    --verify GovernorFullHarness:certora/specs/GovernorPreventLateQuorum.spec \
    --link GovernorFullHarness:token=ERC20VotesHarness \
    --optimistic_loop \
    --loop_iter 1 \
    --rule_sanity advanced \
    $@
