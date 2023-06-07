// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../metatx/ERC2771Context.sol";

// By inheriting from ERC2771Context, Context's internal functions are overridden automatically
contract ERC2771ContextMock is ERC2771Context {
    event Sender(address sender);
    event Data(bytes data, uint256 integerValue, string stringValue);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {
        emit Sender(_msgSender()); // _msgSender() should be accessible during construction
    }

    function msgSender() public {
        address sender = ERC2771Context._msgSender();
        emit Sender(sender);
    }

    function msgData(uint256 integerValue, string memory stringValue) public {
        bytes calldata data = ERC2771Context._msgData();
        emit Data(data, integerValue, stringValue);
    }
}
