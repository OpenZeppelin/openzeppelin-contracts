pragma solidity ^0.4.11;


import '../../contracts/token/MigrationTarget.sol';
import '../../contracts/token/StandardToken.sol';
import '../../contracts/ownership/Ownable.sol';

// example class for migration target token
contract MigrationTargetExample is MigrationTarget, StandardToken, Ownable {

  // migratable token address (source token)
  address sourceToken;

  function setSourceToken(address _sourceToken) onlyOwner {
    if (sourceToken != 0x0) throw;
    sourceToken = _sourceToken;
  }

  function migrateFrom(address _from, uint256 _amount) external {
    if (msg.sender != sourceToken) throw;

    totalSupply = totalSupply.add(_amount);
    balances[_from] = balances[_from].add(_amount);
  }
}
