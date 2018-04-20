pragma solidity ^0.4.21;

import "zos-lib/contracts/migrations/Migratable.sol";
import "./DetailedERC20.sol";
import "./MintableToken.sol";

contract DetailedPremintedToken is Migratable, DetailedERC20, StandardToken {
  function initialize(address _sender, string _name, string _symbol, uint8 _decimals, uint256 _initialBalance) isInitializer("DetailedPremintedToken", "0") {
    DetailedERC20.initialize(_sender, _name, _symbol, _decimals);

    _premint(_sender, _initialBalance);
  }

  function _premint(address _to, uint256 _value) internal {
    balances[_to] += _value;
    emit Transfer(0, _to, _value);
  }
}
