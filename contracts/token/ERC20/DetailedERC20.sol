pragma solidity ^0.4.21;

import "./ERC20.sol";
import 'zos-upgradeability/contracts/migrations/Initializable.sol';

contract DetailedERC20 is Initializable, ERC20 {
  string public name;
  string public symbol;
  uint8 public decimals;

  function initialize(string _name, string _symbol, uint8 _decimals) public isInitializer {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
  }
}
