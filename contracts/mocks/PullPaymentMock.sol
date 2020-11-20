// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../payment/PullPayment.sol";

// mock class using PullPayment
contract PullPaymentMock is PullPayment {
    constructor () public payable { }

    // test helper function to call asyncTransfer
    function callTransfer(address dest, uint256 amount) public {
        _asyncTransfer(dest, amount);
    }
}
