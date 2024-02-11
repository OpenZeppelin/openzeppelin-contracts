pragma solidity ^0.8.0;

contract ReentrancyGuardTransient {
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
