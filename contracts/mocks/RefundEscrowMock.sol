pragma solidity ^0.4.24;

import "../payment/RefundEscrow.sol";

contract RefundEscrowMock is RefundEscrow {
  constructor(address beneficiary) public {
    RefundEscrow.initialize(beneficiary, msg.sender);
  }
}
