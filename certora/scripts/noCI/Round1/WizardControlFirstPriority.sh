#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/WizardControlFirstPriority.sol \
    --link WizardControlFirstPriority:token=ERC20VotesHarness \
    --verify WizardControlFirstPriority:certora/specs/GovernorBase.spec \
    --solc solc \
    --optimistic_loop \
    --disableLocalTypeChecking \
    --settings -copyLoopUnroll=4 \
    --rule canVoteDuringVotingPeriod
