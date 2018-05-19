pragma solidity ^0.4.21;

import "zos-lib/contracts/migrations/Migratable.sol";
import "./DetailedERC20.sol";
import "./MintableToken.sol";

contract DetailedMintableToken is Migratable, DetailedERC20, MintableToken {
  function initialize(address _sender, string _name, string _symbol, uint8 _decimals) isInitializer("DetailedMintableToken", "1.9.0-beta") {
    DetailedERC20.initialize(_name, _symbol, _decimals);
    Ownable.initialize(_sender);
  }
}
