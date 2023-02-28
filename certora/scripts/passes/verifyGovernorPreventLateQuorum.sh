#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/GovernorFullHarness.sol certora/munged/governance/TimelockController.sol \
    --verify GovernorFullHarness:certora/specs/GovernorPreventLateQuorum.spec \
    --link GovernorFullHarness:token=ERC20VotesHarness \
    --optimistic_loop \
    --loop_iter 1 \
    --rules deadlineNeverReduced againstVotesDontCount hasVotedCorrelationNonzero canExtendDeadlineOnce deadlineChangeEffects quorumReachedCantChange quorumLengthGt0 cantExtendWhenQuorumUnreached quorumNumerLTEDenom deprecatedQuorumStateIsUninitialized \
    $@
