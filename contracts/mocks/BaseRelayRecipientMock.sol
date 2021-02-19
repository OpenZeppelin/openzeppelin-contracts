// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ContextMock.sol";
import "../metatx/ERC2771Context.sol";

// By inheriting from ERC2771Context, Context's internal functions are overridden automatically
contract ERC2771ContextMock is ContextMock, ERC2771Context {
    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    function _msgSender() internal override(Context, ERC2771Context) view virtual returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal override(Context, ERC2771Context) view virtual returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
