// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "../proxy/Initializable.sol";

/**
 * @title MigratableMockV1
 * @dev This contract is a mock to test initializable functionality through migrations
 */
contract MigratableMockV1 is Initializable {
  uint256 public x;

  function initialize(uint256 value) public payable initializer {
    x = value;
  }
}

/**
 * @title MigratableMockV2
 * @dev This contract is a mock to test migratable functionality with params
 */
contract MigratableMockV2 is MigratableMockV1 {
  bool internal _migratedV2;
  uint256 public y;

  function migrate(uint256 value, uint256 anotherValue) public payable {
    require(!_migratedV2);
    x = value;
    y = anotherValue;
    _migratedV2 = true;
  }
}

/**
 * @title MigratableMockV3
 * @dev This contract is a mock to test migratable functionality without params
 */
contract MigratableMockV3 is MigratableMockV2 {
  bool internal _migratedV3;

  function migrate() public payable {
    require(!_migratedV3);
    uint256 oldX = x;
    x = y;
    y = oldX;
    _migratedV3 = true;
  }
}
