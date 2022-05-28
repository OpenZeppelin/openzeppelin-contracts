// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../munged/proxy/utils/Initializable4.6.sol";

contract InitializableBasicHarness is Initializable {

    uint256 public unchangeable;
    
    modifier version1() {
        require(_initialized == 1);
        _;
    }

    modifier version2() {
        require(_initialized == 2);
        _;
    }

    function initialize(uint256 val) public initializer {
        unchangeable = val;
    }

    function reinitialize(uint256 val) public reinitializer(2) {
        unchangeable = val;
    }

    function returnsV1() public view version1 returns(uint256) {
        return unchangeable/2;
    }

    function returnsV2() public view version2 returns(uint256) {
        return unchangeable/3;
    }
}
