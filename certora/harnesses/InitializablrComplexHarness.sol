// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../munged/proxy/utils/Initializable4.6.sol";

contract InitializableBasicHarness is Initializable {

    uint256 public unchangeable;

    function initialize(uint256 _val) public initializer {
        unchangeable = _val;
    }
    
    function reinitialize(uint256 _val) public reinitializer(2) {
        unchangeable = _val;
    }
    
}
