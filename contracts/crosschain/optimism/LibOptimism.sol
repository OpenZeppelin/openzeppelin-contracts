// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ICrossDomainMessenger as Optimism_Bridge} from "../../vendor/optimism/ICrossDomainMessenger.sol";

library LibOptimism {
    function isCrossChain(address bridge) internal view returns (bool) {
        return msg.sender == bridge;
    }

    function crossChainSender(address bridge) internal view returns (address) {
        return Optimism_Bridge(bridge).xDomainMessageSender();
    }
}
