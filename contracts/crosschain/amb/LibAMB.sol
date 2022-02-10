// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IAMB as AMB_Bridge } from "../../vendor/amb/IAMB.sol";

library LibAMB {
    function isCrossChain(address bridge) internal view returns (bool) {
        return msg.sender == bridge;
    }

    function crossChainSender(address bridge) internal view returns (address) {
        return AMB_Bridge(bridge).messageSender();
    }
}
