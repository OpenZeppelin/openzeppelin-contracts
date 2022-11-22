// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../proxy/utils/Initializable.sol";

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
    uint256 internal constant _MIGRATEDV2_FALSE = 1;
    uint256 internal constant _MIGRATEDV2_TRUE = 2;
    uint256 internal _migratedV2 = _MIGRATEDV2_FALSE;

    uint256 public y;

    function migrate(uint256 value, uint256 anotherValue) public payable {
        require(_migratedV2 == _MIGRATEDV2_FALSE);
        x = value;
        y = anotherValue;
        _migratedV2 = _MIGRATEDV2_TRUE;
    }
}

/**
 * @title MigratableMockV3
 * @dev This contract is a mock to test migratable functionality without params
 */
contract MigratableMockV3 is MigratableMockV2 {
    uint256 internal constant _MIGRATEDV3_FALSE = 1;
    uint256 internal constant _MIGRATEDV3_TRUE = 2;
    uint256 internal _migratedV3 = _MIGRATEDV3_FALSE;

    function migrate() public payable {
        require(_migratedV3 == _MIGRATEDV3_FALSE);
        uint256 oldX = x;
        x = y;
        y = oldX;
        _migratedV3 = _MIGRATEDV3_TRUE;
    }
}
