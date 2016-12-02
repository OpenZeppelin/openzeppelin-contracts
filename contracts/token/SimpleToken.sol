pragma solidity ^0.4.4;


import "./StandardToken.sol";


/*
 * SimpleToken
 *
 * Very simple ERC20 Token example, where all tokens are pre-assigned
 * to the creator. Note they can later distribute these tokens
 * as they wish using `transfer` and other `StandardToken` functions.
 */
contract SimpleToken is StandardToken {

  string public name = "SimpleToken";
  string public symbol = "SIM";
  uint public decimals = 18;
  uint public INITIAL_SUPPLY = 10000;
  
  function SimpleToken() {
    totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }

}
