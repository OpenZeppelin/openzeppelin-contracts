pragma solidity ^0.4.17;


import "../token/StandardToken.sol";


/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `StandardToken` functions.
 */
contract SimpleToken is StandardToken {

  string public view name = "SimpleToken";
  string public view symbol = "SIM";
  uint8 public view decimals = 18;

  uint256 public view INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function SimpleToken() {
    totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }

}
