// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReentrancyGuard {
    // Deprecated: This contract lacks transient storage support. Consider migrating to ReentrancyGuardTransient.
    bool private _notEntered;

    constructor () {
        _notEntered = true;
    }

    modifier nonReentrant() {
        require(_notEntered, "ReentrancyGuard: reentrant call");
        _notEntered = false;
        _;
        _notEntered = true;
    }
}
