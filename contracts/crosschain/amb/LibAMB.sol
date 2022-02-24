// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IAMB as AMB_Bridge} from "../../vendor/amb/IAMB.sol";

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
     * sender.
     */
    function crossChainSender(address bridge) internal view returns (address) {
        return AMB_Bridge(bridge).messageSender();
    }
}
