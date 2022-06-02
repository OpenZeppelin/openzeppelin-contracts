// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../munged/proxy/utils/Initializable.sol";

contract InitializableA is Initializable {
    uint256 public a;
    
    modifier version1() {
        require(_initialized == 1);
        _;
    }

    modifier versionN(uint8 n) {
        require(_initialized == n);
        _;
    }
    function __InitializableA_init(uint256 _a) internal onlyInitializing {
        a = _a;
    }
    
    function returnsAV1() public view version1 returns(uint256) {
        return a/2;
    }

    function returnsAVN(uint8 n) public view versionN(n) returns(uint256) {
        return a/(n+1);
    }
}

contract InitializableB is Initializable, InitializableA {
    uint256 public b;
    function __InitializableB_init(uint256 _b) internal onlyInitializing {
        b = _b;
    }

    function returnsBV1() public view version1 returns(uint256) {
        return b/2;
    }

    function returnsBVN(uint8 n) public view versionN(n) returns(uint256) {
        return b/(n+1);
    }
}

contract InitializableComplexHarness is Initializable, InitializableB {
    uint256 public val;

    function initialize(uint256 _val, uint256 _a, uint256 _b) initializer public {
        val = _val;
        __InitializableA_init(_a);
        __InitializableB_init(_b);
    }

    function reinitialize(uint256 _val, uint256 _a, uint256 _b, uint8 n) reinitializer(n) public {
        val = _val;
        __InitializableA_init(_a);
        __InitializableB_init(_b);
    }

    function returnsV1() public view version1 returns(uint256) {
        return val/2;
    }

    function returnsVN(uint8 n) public view versionN(n) returns(uint256) {
        return val/(n+1);
    }

    // Harness //
    function initialized() public view returns(uint8) {
        return _initialized;
    }

    function initializing() public view returns(bool) {
        return _initializing;
    }

    function thisIsContract() public view returns(bool) {
        return !Address.isContract(address(this));
    }
}
