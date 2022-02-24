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
     * @dev Returns weither the current function call is the result of a
     * cross-chain message relayed by `bridge`.
     */
    ArbitrumL2_Bridge public constant ARBSYS = ArbitrumL2_Bridge(0x0000000000000000000000000000000000000064);

    function isCrossChain(address bridge) internal view returns (bool) {
        return ArbitrumL2_Bridge(bridge).isTopLevelCall();
    }

    /**
     * @dev Returns the address of the sender that triggered the current
     * cross-chain message through `bridge`.
     *
     * NOTE: {isCrossChain} should be checked before trying to recover the
     * sender.
     */
    function crossChainSender(address bridge) internal view returns (address) {
        return
            ArbitrumL2_Bridge(bridge).wasMyCallersAddressAliased()
                ? ArbitrumL2_Bridge(bridge).myCallersAddressWithoutAliasing()
                : msg.sender;
    }
}
