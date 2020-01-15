pragma solidity ^0.6.0;

import "../../GSN/Context.sol";
import "../Roles.sol";

contract MinterRole is Context {
    using Roles for Roles.Role;

    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);

    Roles.Role private _minters;

    constructor () internal {
        _addMinter(_msgSender());
    }

    modifier onlyMinter() {
        require(isMinter(_msgSender()), "MinterRole: caller does not have the Minter role");
        _;
    }

    function isMinter(address account) public view returns (bool) {
        return _minters.has(account);
    }

    function addMinter(address account) public virtual onlyMinter {
        _addMinter(account);
    }

    function renounceMinter() public virtual {
        _removeMinter(_msgSender());
    }

    function _addMinter(address account) internal virtual {
        _minters.add(account);
        emit MinterAdded(account);
    }

    function _removeMinter(address account) internal virtual {
        _minters.remove(account);
        emit MinterRemoved(account);
    }
}
