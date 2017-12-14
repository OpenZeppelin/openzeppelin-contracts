pragma solidity ^0.4.18;


import "../token/Basic223Token.sol";


/**
 * @title Simple223Token
 * @dev Very simple ERC223 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `Basic223Token` functions.
 */
contract Simple223Token is Basic223Token {

  string public constant name = "Simple223Token";
  string public constant symbol = "SIM";
  uint8 public constant decimals = 18;

  uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function Simple223Token() public {
    totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }

}
