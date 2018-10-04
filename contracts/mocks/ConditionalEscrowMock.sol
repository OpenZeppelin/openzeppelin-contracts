pragma solidity ^0.4.24;


import "../Initializable.sol";
import "../payment/ConditionalEscrow.sol";


// mock class using ConditionalEscrow
contract ConditionalEscrowMock is Initializable, ConditionalEscrow {
  mapping(address => bool) private _allowed;

  constructor() public {
    ConditionalEscrow.initialize();
  }

  function setAllowed(address payee, bool allowed) public {
    _allowed[payee] = allowed;
  }

  function withdrawalAllowed(address payee) public view returns (bool) {
    return _allowed[payee];
  }
}
