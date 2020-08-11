// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../GSN/Context.sol";

contract ContextMock is Context {
    event Sender(address sender);

    function msgSender() public {
        emit Sender(_msgSender());
    }

    event Data(bytes data, uint256 integerValue, string stringValue);

    function msgData(uint256 integerValue, string memory stringValue) public {
        emit Data(_msgData(), integerValue, stringValue);
    }
}

contract ContextMockCaller {
    function callSender(ContextMock context) public {
        context.msgSender();
    }

    function callData(ContextMock context, uint256 integerValue, string memory stringValue) public {
        context.msgData(integerValue, stringValue);
    }
}
