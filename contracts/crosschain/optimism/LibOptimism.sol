// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {ICrossDomainMessenger as Optimism_Bridge} from "../../vendor/optimism/ICrossDomainMessenger.sol";

/**
 * @dev Primitives for cross-chain aware contracts for [Optimism](https://www.optimism.io/).
 * See the [documentation](https://community.optimism.io/docs/developers/bridge/messaging/#accessing-msg-sender)
 * for the functionality used here.
 */
library LibOptimism {
    /**
     * @dev Returns whether the current function call is the result of a
     * cross-chain message relayed by `messenger`.
     */
    function isCrossChain(address messenger) internal view returns (bool) {
        return msg.sender == messenger;
    }

    /**
     * @dev Returns the address of the sender that triggered the current
     * cross-chain message through `messenger`.
     *
     * NOTE: {isCrossChain} should be checked before trying to recover the
     * sender.
     */
    function crossChainSender(address messenger) internal view returns (address) {
        return Optimism_Bridge(messenger).xDomainMessageSender();
    }
}
