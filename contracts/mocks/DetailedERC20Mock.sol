pragma solidity ^0.4.23;

import "../token/ERC20/StandardToken.sol";
import "../token/ERC20/DetailedERC20.sol";


contract DetailedERC20Mock is StandardToken, DetailedERC20 {
  constructor(
    string _name,
    string _symbol,
    uint8 _decimals
  )
    DetailedERC20(_name, _symbol, _decimals)
    public
  {}
}
