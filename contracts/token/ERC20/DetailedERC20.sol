pragma solidity ^0.4.21;

import "./ERC20.sol";
import "zos-lib/contracts/migrations/Migratable.sol";


contract DetailedERC20 is Migratable, ERC20 {
  string public name;
  string public symbol;
  uint8 public decimals;

  function initialize(string _name, string _symbol, uint8 _decimals) public isInitializer("DetailedERC20", "1.9.0") {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
  }
}
