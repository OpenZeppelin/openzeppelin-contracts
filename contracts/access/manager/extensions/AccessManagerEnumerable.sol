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
     * return an empty array. See {_setTargetFunctionRole} for more details.
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
     * return 0. See {_setTargetFunctionRole} for more details.
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
     * Since the target functions for the {ADMIN_ROLE} can't be tracked exhaustively (i.e. by default, all
     * restricted functions), any function that is granted to the {ADMIN_ROLE} will not be tracked by this
     * extension. Developers may opt in for tracking the functions for the {ADMIN_ROLE} by overriding,
     * though, the tracking would not be exhaustive unless {setTargetFunctionRole} is explicitly called
     * for the {ADMIN_ROLE} for each function:
     *
     * ```solidity
     * function _setTargetFunctionRole(address target, bytes4 selector, uint64 roleId) internal virtual override {
     *     uint64 oldRoleId = getTargetFunctionRole(target, selector);
     *     super._setTargetFunctionRole(target, selector, roleId);
     *     if (oldRoleId == ADMIN_ROLE) {
     *         _roleTargetFunctions[oldRoleId][target].remove(selector);
     *     }
     *     if (roleId == ADMIN_ROLE) {
     *         _roleTargetFunctions[roleId][target].add(selector);
     *     }
     * }
     * ```
     */
    function _setTargetFunctionRole(address target, bytes4 selector, uint64 roleId) internal virtual override {
        uint64 oldRoleId = getTargetFunctionRole(target, selector);
        super._setTargetFunctionRole(target, selector, roleId);
        if (oldRoleId != ADMIN_ROLE) {
            _roleTargetFunctions[oldRoleId][target].remove(selector);
        }
        if (roleId != ADMIN_ROLE) {
            _roleTargetFunctions[roleId][target].add(selector);
        }
    }
}
