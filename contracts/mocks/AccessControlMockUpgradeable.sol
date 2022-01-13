// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../access/AccessControlUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract AccessControlMockUpgradeable is Initializable, AccessControlUpgradeable {
    function __AccessControlMock_init() internal onlyInitializing {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __AccessControl_init_unchained();
        __AccessControlMock_init_unchained();
    }

    function __AccessControlMock_init_unchained() internal onlyInitializing {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function setRoleAdmin(bytes32 roleId, bytes32 adminRoleId) public {
        _setRoleAdmin(roleId, adminRoleId);
    }

    function senderProtected(bytes32 roleId) public onlyRole(roleId) {}
    uint256[50] private __gap;
}
