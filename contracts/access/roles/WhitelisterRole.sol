pragma solidity ^0.5.0;

import "../Roles.sol";

/**
 * @title WhitelisterRole
 * @dev Whitelisters are responsible for assigning and removing Whitelisted accounts.
 */
contract WhitelisterRole {
    using Roles for Roles.Role;

    event WhitelisterAdded(address indexed account);
    event WhitelisterRemoved(address indexed account);

    Roles.Role private _whitelisters;

    constructor () internal {
        _addWhitelister(msg.sender);
    }

    modifier onlyWhitelister() {
        require(isWhitelister(msg.sender));
        _;
    }

    function isWhitelister(address account) public view returns (bool) {
        return _whitelisters.has(account);
    }

    function addWhitelister(address account) public onlyWhitelister {
        _addWhitelister(account);
    }

    function renounceWhitelister() public {
        _removeWhitelister(msg.sender);
    }

    function _addWhitelister(address account) internal {
        _whitelisters.add(account);
        emit WhitelisterAdded(account);
    }

    function _removeWhitelister(address account) internal {
        _whitelisters.remove(account);
        emit WhitelisterRemoved(account);
    }
}
