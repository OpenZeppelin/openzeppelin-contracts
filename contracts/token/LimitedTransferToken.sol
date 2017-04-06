pragma solidity ^0.4.8;

import "./ERC20.sol";

/*

LimitedTransferToken defines the generic interface and the implementation
to limit token transferability for different events.

It is intended to be used as a base class for other token contracts.

Overwriting transferableTokens(address holder, uint64 time) is the way to provide
the specific logic for limiting token transferability for a holder over time.

LimitedTransferToken has been designed to allow for different limiting factors,
this can be achieved by recursively calling super.transferableTokens() until the
base class is hit. For example:

function transferableTokens(address holder, uint64 time) constant public returns (uint256) {
  return min256(unlockedTokens, super.transferableTokens(holder, time));
}

A working example is VestedToken.sol:
https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/VestedToken.sol

*/

contract LimitedTransferToken is ERC20 {
  // Checks whether it can transfer or otherwise throws.
  modifier canTransfer(address _sender, uint _value) {
   if (_value > transferableTokens(_sender, uint64(now))) throw;
   _;
  }

  // Checks modifier and allows transfer if tokens are not locked.
  function transfer(address _to, uint _value) canTransfer(msg.sender, _value) {
   return super.transfer(_to, _value);
  }

  // Checks modifier and allows transfer if tokens are not locked.
  function transferFrom(address _from, address _to, uint _value) canTransfer(_from, _value) {
   return super.transferFrom(_from, _to, _value);
  }

  // Default transferable tokens function returns all tokens for a holder (no limit).
  function transferableTokens(address holder, uint64 time) constant public returns (uint256) {
    return balanceOf(holder);
  }
}
