pragma solidity ^0.4.23;

import "./ERC20.sol";


/**
 * @title DetailedERC20 token
 * @dev If you are building a UI, be careful on decimals amount your users can insert
 * @dev mostly if you want to use token with a Crowdsale
 * @dev Remember that on Ethereum the smaller unit is wei.
 * @dev Issue: * https://github.com/OpenZeppelin/openzeppelin-solidity/issues/953
 */
contract DetailedERC20 is ERC20 {
  string public name;
  string public symbol;
  uint8 public decimals;

  constructor(string _name, string _symbol, uint8 _decimals) public {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
  }
}
