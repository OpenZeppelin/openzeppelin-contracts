pragma solidity ^0.4.24;

import "../payment/ConditionalTokenEscrow.sol";
import "../token/ERC20/ERC20.sol";


// mock class using ConditionalTokenEscrow
contract ConditionalTokenEscrowMock is ConditionalTokenEscrow {
  mapping(address => bool) public allowed;

  constructor (ERC20 _token) public TokenEscrow(_token) { }

  function setAllowed(address _payee, bool _allowed) public {
    allowed[_payee] = _allowed;
  }

  function withdrawalAllowed(address _payee) public view returns (bool) {
    return allowed[_payee];
  }
}
