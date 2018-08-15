pragma solidity ^0.4.24;


import "../payment/ConditionalEscrow.sol";


// mock class using ConditionalEscrow
contract ConditionalEscrowMock is ConditionalEscrow {
  mapping(address => bool) public allowed;

  function setAllowed(address _payee, bool _allowed) public {
    allowed[_payee] = _allowed;
  }

  function withdrawalAllowed(address _payee) public view returns (bool) {
    return allowed[_payee];
  }
}
