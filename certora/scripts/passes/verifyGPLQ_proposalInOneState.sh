#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/GovernorFullHarness.sol certora/munged/governance/TimelockController.sol \
    --verify GovernorFullHarness:certora/specs/GovernorPreventLateQuorum.spec \
    --link GovernorFullHarness:token=ERC20VotesHarness \
    --optimistic_loop \
    --optimistic_hashing \
    --rule proposalInOneState \
    --loop_iter 1 \
    --settings -t=1000 \
    $@
