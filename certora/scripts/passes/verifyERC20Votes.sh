#!/usr/bin/env bash

set -euxo pipefail

certoraRun \
    certora/harnesses/ERC20VotesHarness.sol \
    --verify ERC20VotesHarness:certora/specs/ERC20Votes.spec \
    --solc solc \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    $@