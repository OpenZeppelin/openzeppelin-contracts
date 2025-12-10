// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IAccessManagerEnumerable} from "./IAccessManagerEnumerable.sol";
import {AccessManager} from "../AccessManager.sol";
import {EnumerableSet} from "../../../utils/structs/EnumerableSet.sol";

/**
 * @dev Extension of {AccessManager} that allows enumerating the members of each role
 * and the target functions each role is allowed to call.
 *
 * NOTE: Given {ADMIN_ROLE} is the default role for every restricted function, the
 * {getRoleTargetFunctions} and {getRoleTargetFunctionCount} functions will return an empty array
 * and 0 respectively.
 */
abstract contract AccessManagerEnumerable is IAccessManagerEnumerable, AccessManager {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes4Set;

    mapping(uint64 roleId => EnumerableSet.AddressSet) private _roleMembers;
    mapping(uint64 roleId => mapping(address target => EnumerableSet.Bytes4Set)) private _roleTargetFunctions;

    /// @inheritdoc IAccessManagerEnumerable
    function getRoleMember(uint64 roleId, uint256 index) public view virtual returns (address) {
        return _roleMembers[roleId].at(index);
    }

    /// @inheritdoc IAccessManagerEnumerable
    function getRoleMembers(uint64 roleId, uint256 start, uint256 end) public view virtual returns (address[] memory) {
        return _roleMembers[roleId].values(start, end);
    }

    /// @inheritdoc IAccessManagerEnumerable
    function getRoleMemberCount(uint64 roleId) public view virtual returns (uint256) {
        return _roleMembers[roleId].length();
    }

    /// @inheritdoc IAccessManagerEnumerable
    function getRoleTargetFunction(uint64 roleId, address target, uint256 index) public view virtual returns (bytes4) {
        return _roleTargetFunctions[roleId][target].at(index);
    }

    /*
     * @dev See {IAccessManagerEnumerable-getRoleTargetFunctions}
     *
     * NOTE: Given {ADMIN_ROLE} is the default role for every restricted function, passing {ADMIN_ROLE} as `roleId` will
     * return an empty array. See {_updateRoleTargetFunction} for more details.
     */
    function getRoleTargetFunctions(
        uint64 roleId,
        address target,
        uint256 start,
        uint256 end
    ) public view virtual returns (bytes4[] memory) {
        return _roleTargetFunctions[roleId][target].values(start, end);
    }

    /*
     * @dev See {IAccessManagerEnumerable-getRoleTargetFunctionCount}
     *
     * NOTE: Given {ADMIN_ROLE} is the default role for every restricted function, passing {ADMIN_ROLE} as `roleId` will
     * return 0. See {_updateRoleTargetFunction} for more details.
     */
    function getRoleTargetFunctionCount(uint64 roleId, address target) public view virtual returns (uint256) {
        return _roleTargetFunctions[roleId][target].length();
    }

    /// @dev See {AccessManager-_grantRole}. Adds the account to the role members set.
    function _grantRole(
        uint64 roleId,
        address account,
        uint32 grantDelay,
        uint32 executionDelay
    ) internal virtual override returns (bool) {
        bool granted = super._grantRole(roleId, account, grantDelay, executionDelay);
        if (granted) {
            _roleMembers[roleId].add(account);
        }
        return granted;
    }

    /// @dev See {AccessManager-_revokeRole}. Removes the account from the role members set.
    function _revokeRole(uint64 roleId, address account) internal virtual override returns (bool) {
        bool revoked = super._revokeRole(roleId, account);
        if (revoked) {
            _roleMembers[roleId].remove(account);
        }
        return revoked;
    }

    /**
     * @dev See {AccessManager-_setTargetFunctionRole}. Adds the selector to the role target functions set.
     *
     * NOTE: Does not track function selectors for the {ADMIN_ROLE}. See {_updateRoleTargetFunction}.
     */
    function _setTargetFunctionRole(address target, bytes4 selector, uint64 roleId) internal virtual override {
        uint64 oldRoleId = getTargetFunctionRole(target, selector);
        super._setTargetFunctionRole(target, selector, roleId);
        _updateRoleTargetFunction(target, selector, oldRoleId, roleId);
    }

    /**
     * @dev Updates the role target functions sets when a function's role is changed.
     *
     * This function does not track function selectors for the {ADMIN_ROLE}, since exhaustively tracking
     * all restricted/admin functions is impractical (by default, all restricted functions are assigned to {ADMIN_ROLE}).
     * Therefore, roles assigned as {ADMIN_ROLE} will not have their selectors included in this extension's tracking.
     *
     * Developers who wish to explicitly track {ADMIN_ROLE} can override this function. For example:
     *
     * ```solidity
     * function _updateRoleTargetFunction(address target, bytes4 selector, uint64 oldRoleId, uint64 newRoleId) internal virtual override {
     *     if (oldRoleId != 0) {
     *         _roleTargetFunctions[oldRoleId][target].remove(selector);
     *     }
     *     if (newRoleId != 0) {
     *         _roleTargetFunctions[newRoleId][target].add(selector);
     *     }
     * }
     * ```
     */
    function _updateRoleTargetFunction(
        address target,
        bytes4 selector,
        uint64 oldRoleId,
        uint64 newRoleId
    ) internal virtual {
        if (oldRoleId != ADMIN_ROLE) {
            _roleTargetFunctions[oldRoleId][target].remove(selector);
        }
        if (newRoleId != ADMIN_ROLE) {
            _roleTargetFunctions[newRoleId][target].add(selector);
        }
    }
}
