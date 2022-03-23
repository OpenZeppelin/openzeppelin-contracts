// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IArbSys as ArbitrumL2_Bridge} from "../../vendor/arbitrum/IArbSys.sol";

/**
 * @dev Primitives for cross-chain aware contracts for
 * [Arbitrum](https://arbitrum.io/).
 *
 * This version should only be used on L2 to process cross-chain messages
 * originating from L1. For the other side, use {LibArbitrumL1}.
 */
library LibArbitrumL2 {
    /**
     * @dev Returns whether the current function call is the result of a
     * cross-chain message relayed by `arbsys`.
     */
    address public constant ARBSYS = ArbitrumL2_Bridge(0x0000000000000000000000000000000000000064);

    function isCrossChain(address arbsys) internal view returns (bool) {
        return ArbitrumL2_Bridge(arbsys).isTopLevelCall();
    }

    /**
     * @dev Returns the address of the sender that triggered the current
     * cross-chain message through `arbsys`.
     *
     * NOTE: {isCrossChain} should be checked before trying to recover the
     * sender.
     */
    function crossChainSender(address arbsys) internal view returns (address) {
        return
            ArbitrumL2_Bridge(arbsys).wasMyCallersAddressAliased()
                ? ArbitrumL2_Bridge(arbsys).myCallersAddressWithoutAliasing()
                : msg.sender;
    }
}
