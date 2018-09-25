pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../payment/Escrow.sol";

contract EscrowMock is Initializable, Escrow {
  constructor() public {
    Escrow.initialize();
  }
}
