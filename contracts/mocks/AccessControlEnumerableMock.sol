// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../access/AccessControlEnumerable.sol";
import "../access/AccessControlEnumerable2.sol";

contract AccessControlEnumerableMock is AccessControlEnumerable, AccessControlEnumerable2 {
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function setRoleAdmin(bytes32 roleId, bytes32 adminRoleId) public {
        _setRoleAdmin(roleId, adminRoleId);
    }

    function _grantRole(bytes32 role, address account)
    internal virtual override(AccessControlEnumerable, AccessControlEnumerable2)
    {
        super._grantRole(role, account);
    }

    function _revokeRole(bytes32 role, address account)
    internal virtual override(AccessControlEnumerable, AccessControlEnumerable2)
    {
        super._revokeRole(role, account);
    }
}
