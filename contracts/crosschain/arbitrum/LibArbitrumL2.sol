// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IArbSys as ArbitrumL2_Bridge} from "../../vendor/arbitrum/IArbSys.sol";

library LibArbitrumL2 {
    ArbitrumL2_Bridge public constant ARBSYS = ArbitrumL2_Bridge(0x0000000000000000000000000000000000000064);

    function isCrossChain(address bridge) internal view returns (bool) {
        return ArbitrumL2_Bridge(bridge).isTopLevelCall();
    }

    function crossChainSender(address bridge) internal view returns (address) {
        return
            ArbitrumL2_Bridge(bridge).wasMyCallersAddressAliased()
                ? ArbitrumL2_Bridge(bridge).myCallersAddressWithoutAliasing()
                : msg.sender;
    }
}
