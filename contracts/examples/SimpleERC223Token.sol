pragma solidity ^0.4.9;


import "../token/ERC223/ERC223Token.sol";


/**
* @title Simple ERC223 token constructor example
* @dev A simple ERC223 token example.
* @dev All tokens are initially given msg.sender and should then be allocated using transfer() functions.
*/
contract SimpleERC223Token is ERC223Token {
  // Simple constructor
  function SimpleERC223Token()  public {
    name = "SimpleToken";
    symbol = "SIMPLE";
    decimals = uint8(8);
    totalSupply = 100 * (10 ** uint256(decimals));
    balances[msg.sender] = totalSupply;
  }
}