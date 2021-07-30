// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../proxy/utils/Initializable.sol";

/**
 * @title InitializableMock
 * @dev This contract is a mock to test initializable functionality
 */
contract InitializableMock is Initializable {
    bool public initializerRan;
    uint256 public x;

    function initialize() public initializer {
        initializerRan = true;
    }

    function initializeNested() public initializer {
        initialize();
    }

    function initializeWithX(uint256 x_) public payable initializer {
        x = x_;
    }

    function nonInitializable(uint256 x_) public payable {
        x = x_;
    }

    function fail() public pure {
        require(false, "InitializableMock forced failure");
    }
}
