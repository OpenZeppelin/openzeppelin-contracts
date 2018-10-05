pragma solidity ^0.4.24;

import "../token/ERC20/ERC20.sol";
import "../token/ERC20/ERC20Detailed.sol";


contract ERC20DetailedMock is ERC20, ERC20Detailed {
  constructor(
    string name,
    string symbol,
    uint8 decimals
  )
    public
  {
    ERC20Detailed.initialize(name, symbol, decimals);
  }
}
