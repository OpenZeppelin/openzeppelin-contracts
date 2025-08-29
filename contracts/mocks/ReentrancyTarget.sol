// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../security/ReentrancyGuardHybrid.sol";

contract ReentrancyTarget is ReentrancyGuardHybrid {
    uint256 public count;
    function callMe() public nonReentrant {
        count++;
    }

    function callAgain() public nonReentrant {
        callMe();
    }

    function callMeNS() public nonReentrantNS(bytes32(uint256(1))) {
        count++;
    }

    function callAgainNS() public nonReentrantNS(bytes32(uint256(1))) {
        callMeNS();
    }
}

