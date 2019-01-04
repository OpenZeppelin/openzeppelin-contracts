pragma solidity ^0.4.24;

import "../Roles.sol";
import "../../ownership/Ownable.sol";
/**
 * @title WhitelisterRole
 * @dev Whitelisters are responsible for assigning and removing Whitelisted accounts.
 */
contract WhitelisterRole is Ownable {
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

    modifier onlyAdmin() {
        require(isWhitelister(msg.sender) || isOwner());
        _;
    }

    function isWhitelister(address account) public view returns (bool) {
        return _whitelisters.has(account);
    }

    function addWhitelister(address account) public onlyAdmin {
        _addWhitelister(account);
    }

    function renounceWhitelister() public {
        _removeWhitelister(msg.sender);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        _addWhitelister(newOwner);
        Ownable.transferOwnership(newOwner);
    }

    function resetWhitelist() public onlyOwner {
        _whitelisters.removeAll(owner());
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
