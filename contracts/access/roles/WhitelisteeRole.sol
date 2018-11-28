pragma solidity ^0.4.24;

import "../Roles.sol";
import "./WhitelisterRole.sol";

contract WhitelisteeRole is WhitelisterRole {
    using Roles for Roles.Role;

    event WhitelisteeAdded(address indexed account);
    event WhitelisteeRemoved(address indexed account);

    Roles.Role private _whitelistees;

    modifier onlyWhitelistee() {
        require(isWhitelistee(msg.sender));
        _;
    }

    function isWhitelistee(address account) public view returns (bool) {
        return _whitelistees.has(account);
    }

    function addWhitelistee(address account) public onlyWhitelister {
        _addWhitelistee(account);
    }

    function renounceWhitelistee() public {
        _removeWhitelistee(msg.sender);
    }

    function _addWhitelistee(address account) internal {
        _whitelistees.add(account);
        emit WhitelisteeAdded(account);
    }

    function _removeWhitelistee(address account) internal {
        _whitelistees.remove(account);
        emit WhitelisteeRemoved(account);
    }
}
