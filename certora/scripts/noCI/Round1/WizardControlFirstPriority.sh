#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20VotesHarness.sol certora/harnesses/WizardControlFirstPriority.sol \
    --verify WizardControlFirstPriority:certora/specs/GovernorBase.spec \
    --link WizardControlFirstPriority:token=ERC20VotesHarness \
    --solc solc \
    --optimistic_loop \
    --disableLocalTypeChecking \
    --settings -copyLoopUnroll=4 \
    $@
