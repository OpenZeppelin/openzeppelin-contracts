pragma solidity ^0.4.8;

import "./ERC20.sol";

contract TransferableToken is ERC20 {
  modifier canTransfer(address _sender, uint _value) {
   if (_value > transferableTokens(_sender, uint64(now))) throw;
   _;
  }

  function transfer(address _to, uint _value) canTransfer(msg.sender, _value) returns (bool success) {
   return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint _value) canTransfer(_from, _value) returns (bool success) {
   return super.transferFrom(_from, _to, _value);
  }

  function transferableTokens(address holder, uint64 time) constant public returns (uint256) {
    return balanceOf(holder);
  }
}
