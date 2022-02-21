// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (security/ReentrancyGuard.sol)
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/ReentrancyGuard.sol

pragma solidity ^0.8.0;

abstract contract ReentrancyGuard {
    bool private constant _NOT_ENTERED = false;
    bool private constant _ENTERED = true;

    mapping (address => bool) private _status;

    modifier nonReentrant() {
        // On the first call to nonReentrant, _notEntered will be false
        require(_status[msg.sender] != _ENTERED, "ReentrancyGuard: reentrant call");
        
        // Any calls to nonReentrant after this point will fail
        _status[msg.sender] = _ENTERED;
        
        _;

        //_status[msg.sender] = _NOT_ENTERED;
        delete _status[msg.sender];
    }

}
