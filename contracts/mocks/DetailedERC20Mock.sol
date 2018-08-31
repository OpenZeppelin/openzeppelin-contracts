pragma solidity ^0.4.24;

import "../token/ERC20/ERC20.sol";
import "../token/ERC20/ERC20Detailed.sol";


contract ERC20DetailedMock is ERC20, ERC20Detailed {
  constructor(
    string _name,
    string _symbol,
    uint8 _decimals
  )
    ERC20Detailed(_name, _symbol, _decimals)
    public
  {}
}
