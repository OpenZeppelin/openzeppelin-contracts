pragma solidity ^0.5.0;

import "../../GSN/Context.sol";
import "../Roles.sol";

contract RevokerRole is Context {
    using Roles for Roles.Role;

    event RevokerAdded(address indexed account);
    event RevokerRemoved(address indexed account);

    Roles.Role private _revokers;

    constructor () internal {
        _addRevoker(_msgSender());
    }

    modifier onlyRevoker() {
        require(isRevoker(_msgSender()), "RevokerRole: caller does not have the Revoker role");
        _;
    }

    function isRevoker(address account) public view returns (bool) {
        return _revokers.has(account);
    }

    function addRevoker(address account) public onlyRevoker {
        _addRevoker(account);
    }

    function renounceRevoker() public {
        _removeRevoker(_msgSender());
    }

    function _addRevoker(address account) internal {
        _revokers.add(account);
        emit RevokerAdded(account);
    }

    function _removeRevoker(address account) internal {
        _revokers.remove(account);
        emit RevokerRemoved(account);
    }
}
