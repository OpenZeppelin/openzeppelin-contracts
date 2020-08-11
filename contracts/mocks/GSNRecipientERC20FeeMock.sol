// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../GSN/GSNRecipient.sol";
import "../GSN/GSNRecipientERC20Fee.sol";

contract GSNRecipientERC20FeeMock is GSNRecipient, GSNRecipientERC20Fee {
    constructor(string memory name, string memory symbol) public GSNRecipientERC20Fee(name, symbol) { }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    event MockFunctionCalled(uint256 senderBalance);

    function mockFunction() public {
        emit MockFunctionCalled(token().balanceOf(_msgSender()));
    }
}
