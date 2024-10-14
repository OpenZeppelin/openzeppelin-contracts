// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {ERCXXXXReceiver} from "../../crosschain/draft-ERCXXXXReceiver.sol";

abstract contract ERCXXXXReceiverMock is ERCXXXXReceiver {
    function _processMessage(
        address gateway,
        string calldata source,
        string calldata sender,
        bytes calldata payload,
        bytes[] calldata attributes
    ) internal virtual override {
        // do nothing
    }
}
