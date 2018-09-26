pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../payment/RefundEscrow.sol";

contract RefundEscrowMock is Initializable, RefundEscrow {
  constructor(address beneficiary) public {
    RefundEscrow.initialize(beneficiary);
  }
}
