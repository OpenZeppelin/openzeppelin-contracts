// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "../patched/proxy/utils/Initializable.sol";

contract InitializableHarness is Initializable {
    function initialize()           public initializer      {}
    function reinitialize(uint64 n) public reinitializer(n) {}
    function disable()              public { _disableInitializers(); }

    function nested_init_init()                       public initializer      { initialize();    }
    function nested_init_reinit(uint64 m)             public initializer      { reinitialize(m); }
    function nested_reinit_init(uint64 n)             public reinitializer(n) { initialize();    }
    function nested_reinit_reinit(uint64 n, uint64 m) public reinitializer(n) { reinitialize(m); }

    function version() public view returns (uint64) {
        return _getInitializedVersion();
    }

    function initializing() public view returns (bool) {
        return _isInitializing();
    }
}
