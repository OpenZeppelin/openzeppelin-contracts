pragma solidity ^0.4.24;

import "../payment/Escrow.sol";

contract EscrowMock is Escrow {
  constructor() public {
    Escrow.initialize(msg.sender);
  }
}
