#!/bin/bash

make -C certora munged

sh certora/scripts/Round2/verifyAccessControl.sh
sh certora/scripts/Round2/verifyERC20FlashMint.sh
sh certora/scripts/Round2/verifyERC20Votes.sh
sh certora/scripts/Round2/verifyERC20Wrapper.sh
sh certora/scripts/Round2/verifyERC721Votes.sh
sh certora/scripts/Round2/verifyERC1155.sh
sh certora/scripts/Round2/verifyTimelock.sh