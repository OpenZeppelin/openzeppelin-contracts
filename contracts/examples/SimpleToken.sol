pragma solidity ^0.4.11;


import "../token/StandardToken.sol";


/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `StandardToken` functions.
 */
contract SimpleToken is StandardToken {

  string public constant NAME = "SimpleToken";
  string public constant SYMBOL = "SIM";
  uint8 public constant DECIMALS = 18;

  uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(DECIMALS));

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function SimpleToken() {
    totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }

}
