pragma solidity ^0.5.0;

import "../payment/PullPayment.sol";

// mock class using PullPayment
contract PullPaymentMock is PullPayment {
    constructor () public payable {
        // solhint-disable-previous-line no-empty-blocks
    }

    // test helper function to call asyncTransfer
    function callTransfer(address dest, uint256 amount) public {
        _asyncTransfer(dest, amount);
    }
}
