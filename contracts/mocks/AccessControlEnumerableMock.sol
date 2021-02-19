// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../access/AccessControlEnumerable.sol";
import "../access/AccessControlEnumerableExtra.sol";

contract AccessControlEnumerableMock is AccessControlEnumerable, AccessControlEnumerableExtra {
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function setRoleAdmin(bytes32 roleId, bytes32 adminRoleId) public {
        _setRoleAdmin(roleId, adminRoleId);
    }

    function grantRole(bytes32 role, address account)
    public virtual override(AccessControlEnumerable, AccessControlEnumerableExtra)
    {
        super.grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account)
    public virtual override(AccessControlEnumerable, AccessControlEnumerableExtra)
    {
        super.revokeRole(role, account);
    }

    function _setupRole(bytes32 role, address account)
    internal virtual override(AccessControlEnumerable, AccessControlEnumerableExtra)
    {
        super._setupRole(role, account);
    }
}
