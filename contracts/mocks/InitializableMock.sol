// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../proxy/utils/Initializable.sol";

/**
 * @title InitializableMock
 * @dev This contract is a mock to test initializable functionality
 */
contract InitializableMock is Initializable {
    bool public initializerRan;
    bool public initializerRan2;
    uint256 public x;

    function initialize() public initializer {
        initializerRan = true;
    }

    function initialize2() public onlyInitializing {
        initializerRan2 = true;
    }

    function initializeNested() public initializer {
        initialize();
    }

    function initializeNested2() public initializer {
        initialize2();
    }

    function initializeWithX(uint256 _x) public payable initializer {
        x = _x;
    }

    function nonInitializable(uint256 _x) public payable {
        x = _x;
    }

    function fail() public pure {
        require(false, "InitializableMock forced failure");
    }
}

contract ConstructorInitializableMock is Initializable {
    bool public initializerRan;
    bool public initializerRan2;

    constructor() initializer {
        initialize();
        initialize2();
    }

    function initialize() public initializer {
        initializerRan = true;
    }

    function initialize2() public onlyInitializing {
        initializerRan2 = true;
    }
}
