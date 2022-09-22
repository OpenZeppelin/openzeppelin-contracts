#!/usr/bin/env bash

set -euxo pipefail

for f in certora/harnesses/ERC20{Votes,Permit,Wrapper}Harness.sol
do
    echo "Processing $f"
    file=$(basename $f)
    echo ${file%.*}
    certoraRun certora/harnesses/$file \
        --verify ${file%.*}:certora/specs/sanity.spec "$@" \
        --solc solc \
        --optimistic_loop \
        --settings -copyLoopUnroll=4,-strictDecompiler=false \
        --msg "checking sanity on ${file%.*}"
done
