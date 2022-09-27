#!/usr/bin/env bash

set -euxo pipefail

# Changed: GovernorHarness → GovernorPreventLateQuorumHarness
certoraRun \
    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/GovernorPreventLateQuorumHarness.sol \
    --verify GovernorPreventLateQuorumHarness:certora/specs/GovernorBase.spec \
    --solc solc \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --rule voteStartBeforeVoteEnd
