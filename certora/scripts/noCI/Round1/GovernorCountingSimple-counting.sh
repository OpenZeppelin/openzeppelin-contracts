#!/usr/bin/env bash

set -euxo pipefail

# Changed: GovernorBasicHarness → GovernorPreventLateQuorumHarness
certoraRun \
    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/GovernorPreventLateQuorumHarness.sol \
    --verify GovernorPreventLateQuorumHarness:certora/specs/GovernorCountingSimple.spec \
    --solc solc \
    --optimistic_loop \
    --settings -copyLoopUnroll=4
