// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../patched/proxy/utils/Initializable.sol";

contract InitializableHarness is Initializable {
    function initialize() public initializer {}
    function reinitialize(uint8 n) public reinitializer(n) {}
    function disable() public { _disableInitializers(); }

    // Harness
    function version() public view returns (uint8) {
        return _getInitializedVersion();
    }

    function initializing() public view returns (bool) {
        return _isInitializing();
    }
}
