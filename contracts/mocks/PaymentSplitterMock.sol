pragma solidity ^0.4.24;

import "../payment/PaymentSplitter.sol";

contract PaymentSplitterMock is PaymentSplitter {
    constructor(address[] payees, uint256[] shares) public {
        PaymentSplitter.initialize(payees, shares);
    }
}
