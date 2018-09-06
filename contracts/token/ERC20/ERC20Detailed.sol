pragma solidity ^0.4.24;

import "./IERC20.sol";


/**
 * @title ERC20Detailed token
 * @dev The decimals are only for visualization purposes.
 * All the operations are done using the smallest and indivisible token unit,
 * just as on Ethereum all the operations are done in wei.
 */
contract ERC20Detailed is IERC20 {
  string private name_;
  string private symbol_;
  uint8 private decimals_;

  constructor(string _name, string _symbol, uint8 _decimals) public {
    name_ = _name;
    symbol_ = _symbol;
    decimals_ = _decimals;
  }

  /**
   * @return the name of the token.
   */
  function name() public view returns(string) {
    return name_;
  }

  /**
   * @return the symbol of the token.
   */
  function symbol() public view returns(string) {
    return symbol_;
  }

  /**
   * @return the number of decimals of the token.
   */
  function decimals() public view returns(uint8) {
    return decimals_;
  }
}
