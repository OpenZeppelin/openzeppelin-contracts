#!/usr/bin/env bash

set -euxo pipefail

# Changed: GovernorHarness missing
#
# Note: rule `immutableFieldsAfterProposalCreation` fails with
# GovernorFullHarness because of late quorum changing the vote's end.
certoraRun \
    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/GovernorHarness.sol \
    --verify GovernorHarness:certora/specs/GovernorBase.spec \
    --link GovernorHarness:token=ERC20VotesHarness \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    $@