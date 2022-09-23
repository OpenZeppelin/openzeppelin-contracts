#!/usr/bin/env bash

set -euxo pipefail

# for f in certora/harnesses/Wizard*.sol
# do
#     echo "Processing $f"
#     file=$(basename $f)
#     echo ${file%.*}
#     certoraRun \
#         certora/harnesses/$file \
#         --verify ${file%.*}:certora/specs/sanity.spec "$@" \
#         --solc solc \
#         --optimistic_loop \
#         --settings -copyLoopUnroll=4 \
#         --msg "checking sanity on ${file%.*}"
# done

# TimelockController
certoraRun \
    certora/harnesses/TimelockControllerHarness.sol \
    --verify TimelockControllerHarness:certora/specs/sanity.spec \
    --solc solc \
    --optimistic_loop \
    --msg "sanity and keccak check"

# Votes
# certoraRun \
#     certora/harnesses/VotesHarness.sol \
#     --verify VotesHarness:certora/specs/sanity.spec \
#     --solc solc \
#     --optimistic_loop \
#     --settings -strictDecompiler=false,-assumeUnwindCond \
#     --msg "sanityVotes"
