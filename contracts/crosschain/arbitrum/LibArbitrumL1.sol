// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IBridge as ArbitrumL1_Bridge} from "../../vendor/arbitrum/IBridge.sol";
import {IInbox as ArbitrumL1_Inbox} from "../../vendor/arbitrum/IInbox.sol";
import {IOutbox as ArbitrumL1_Outbox} from "../../vendor/arbitrum/IOutbox.sol";

library LibArbitrumL1 {
    function isCrossChain(address inbox) internal view returns (bool) {
        return msg.sender == ArbitrumL1_Inbox(inbox).bridge();
    }

    function crossChainSender(address inbox) internal view returns (address) {
        return ArbitrumL1_Outbox(ArbitrumL1_Bridge(ArbitrumL1_Inbox(inbox).bridge()).activeOutbox()).l2ToL1Sender();
    }
}
