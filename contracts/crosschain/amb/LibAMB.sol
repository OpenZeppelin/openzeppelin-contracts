// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (crosschain/amb/LibAMB.sol)

pragma solidity ^0.8.4;

import {IAMB as AMB_Bridge} from "../../vendor/amb/IAMB.sol";
import "../errors.sol";

/**
 * @dev Primitives for cross-chain aware contracts using the
 * [AMB](https://docs.tokenbridge.net/amb-bridge/about-amb-bridge)
 * family of bridges.
 */
library LibAMB {
    /**
     * @dev Returns whether the current function call is the result of a
     * cross-chain message relayed by `bridge`.
     */
    function isCrossChain(address bridge) internal view returns (bool) {
        return msg.sender == bridge;
    }

    /**
     * @dev Returns the address of the sender that triggered the current
     * cross-chain message through `bridge`.
     *
     * NOTE: {isCrossChain} should be checked before trying to recover the
     * sender, as it will revert with `NotCrossChainCall` if the current
     * function call is not the result of a cross-chain message.
     */
    function crossChainSender(address bridge) internal view returns (address) {
        if (!isCrossChain(bridge)) revert NotCrossChainCall();
        return AMB_Bridge(bridge).messageSender();
    }
}
