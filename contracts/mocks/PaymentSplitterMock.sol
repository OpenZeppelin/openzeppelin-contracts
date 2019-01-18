pragma solidity ^0.5.0;

import "../payment/PaymentSplitter.sol";

contract PaymentSplitterMock is PaymentSplitter {
    constructor(address[] memory payees, uint256[] memory shares) public {
        PaymentSplitter.initialize(payees, shares);
    }
}
