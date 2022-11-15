#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/GovernorFullHarness.sol certora/munged/governance/TimelockController.sol \
    --verify GovernorFullHarness:certora/specs/GPLQ_proposalInOneState.spec \
    --link GovernorFullHarness:token=ERC20VotesHarness \
    --optimistic_loop \
    --rule deadlineCantBeUnextended \
    --loop_iter 1 \
    $@
