#!/bin/bash

make -C certora munged

sh certora/scripts/verifyAllSasha
sh certora/scripts/verifyERC20Votes.sh "checking ERC20Votes.spec on ERC20Votes.sol"
sh certora/scripts/verifyERC721Votes.sh "checking ERC721Votes.spec on draft-ERC721Votes.sol and Votes.sol"