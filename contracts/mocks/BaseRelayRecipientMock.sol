// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ContextMock.sol";
import "../GSNv2/BaseRelayRecipient.sol";

// By inheriting from BaseRelayRecipient, Context's internal functions are overridden automatically
contract BaseRelayRecipientMock is ContextMock, BaseRelayRecipient {
    constructor(address trustedForwarder) BaseRelayRecipient(trustedForwarder) {}

    function _msgSender() internal override(Context, BaseRelayRecipient) view virtual returns (address) {
        return BaseRelayRecipient._msgSender();
    }

    function _msgData() internal override(Context, BaseRelayRecipient) view virtual returns (bytes calldata) {
        return BaseRelayRecipient._msgData();
    }
}
