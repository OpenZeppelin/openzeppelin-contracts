// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IBridge as ArbitrumL1_Bridge} from "../../vendor/arbitrum/IBridge.sol";
import {IInbox as ArbitrumL1_Inbox} from "../../vendor/arbitrum/IInbox.sol";
import {IOutbox as ArbitrumL1_Outbox} from "../../vendor/arbitrum/IOutbox.sol";

/**
 * @dev Primitives for cross-chain aware contracts for
 * [Arbitrum](https://arbitrum.io/).
 *
 * This version should only be used on L1 to process cross-chain messages
 * originating from L2. For the other side, use {LibArbitrumL2}.
 */
library LibArbitrumL1 {
    /**
     * @dev Returns weither the current function call is the result of a
     * cross-chain message relayed by `bridge`.
     */
    function isCrossChain(address inbox) internal view returns (bool) {
        return msg.sender == ArbitrumL1_Inbox(inbox).bridge();
    }

    /**
     * @dev Returns the address of the sender that triggered the current
     * cross-chain message through `bridge`.
     *
     * NOTE: {isCrossChain} should be checked before trying to recover the
     * sender.
     */
    function crossChainSender(address inbox) internal view returns (address) {
        return ArbitrumL1_Outbox(ArbitrumL1_Bridge(ArbitrumL1_Inbox(inbox).bridge()).activeOutbox()).l2ToL1Sender();
    }
}
