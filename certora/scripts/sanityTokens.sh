#!/bin/bash

make -C certora munged

for f in certora/harnesses/{ERC20Votes,ERC20Wrapper,ERC20Permit}Harness.sol
do
    echo "Processing $f"
    file=$(basename $f)
    echo ${file%.*}
    certoraRun certora/harnesses/$file \
        --verify ${file%.*}:certora/specs/sanity.spec "$@" \
        --solc solc8.2 --staging \
        --optimistic_loop \
        --msg "checking sanity on ${file%.*}" \
        --settings -copyLoopUnroll=4 \
        --send_only
done
