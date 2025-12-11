// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {AccessManager} from "../../access/manager/AccessManager.sol";
import {EnumerableSet} from "../../utils/structs/EnumerableSet.sol";

/**
 * @dev Extension of {AccessManager} that allows enumerating the members of each role
 * and the target functions each role is allowed to call.
 *
 * NOTE: Given {ADMIN_ROLE} is the default role for every restricted function, the
 * {getRoleTargetFunctions} and {getRoleTargetFunctionCount} functions will return an empty array
 * and 0 respectively.
 */
abstract contract AccessManagerEnumerable is AccessManager {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes4Set;

    mapping(uint64 roleId => EnumerableSet.AddressSet) private _roleMembers;
    mapping(uint64 roleId => mapping(address target => EnumerableSet.Bytes4Set)) private _roleTargetFunctions;

    /**
     * @dev Returns the number of accounts that have `roleId`. Can be used
     * together with {getRoleMember} to enumerate all bearers of a role.
     */
    function getRoleMemberCount(uint64 roleId) public view virtual returns (uint256) {
        return _roleMembers[roleId].length();
    }

    /**
     * @dev Returns one of the accounts that have `roleId`. `index` must be a
     * value between 0 and {getRoleMemberCount}, non-inclusive.
     *
     * Role bearers are not sorted in any particular way, and their ordering may change at any point.
     *
     * WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
     * you perform all queries on the same block. See the following
     * https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
     * for more information.
     */
    function getRoleMember(uint64 roleId, uint256 index) public view virtual returns (address) {
        return _roleMembers[roleId].at(index);
    }

    /**
     * @dev Returns a range of accounts that have `roleId`. `start` and `end` define the range bounds.
     * `start` is inclusive and `end` is exclusive.
     *
     * Role bearers are not sorted in any particular way, and their ordering may change at any point.
     *
     * It is not necessary to call {getRoleMemberCount} before calling this function. Using `start = 0` and
     * `end = type(uint256).max` will return every member of `roleId`.
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function getRoleMembers(uint64 roleId, uint256 start, uint256 end) public view virtual returns (address[] memory) {
        return _roleMembers[roleId].values(start, end);
    }

    /**
     * @dev Returns the number of target function selectors that require `roleId` for the given `target`.
     * Can be used together with {getRoleTargetFunction} to enumerate all target functions for a role on a specific target.
     *
     * NOTE: Given {ADMIN_ROLE} is the default role for every restricted function, passing {ADMIN_ROLE} as `roleId` will
     * return 0. See {_updateRoleTargetFunction} for more details.
     */
    function getRoleTargetFunctionCount(uint64 roleId, address target) public view virtual returns (uint256) {
        return _roleTargetFunctions[roleId][target].length();
    }

    /**
     * @dev Returns one of the target function selectors that require `roleId` for the given `target`.
     * `index` must be a value between 0 and {getRoleTargetFunctionCount}, non-inclusive.
     *
     * Target function selectors are not sorted in any particular way, and their ordering may change at any point.
     *
     * WARNING: When using {getRoleTargetFunction} and {getRoleTargetFunctionCount}, make sure
     * you perform all queries on the same block. See the following
     * https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
     * for more information.
     */
    function getRoleTargetFunction(uint64 roleId, address target, uint256 index) public view virtual returns (bytes4) {
        return _roleTargetFunctions[roleId][target].at(index);
    }

    /**
     * @dev Returns a range of target function selectors that require `roleId` for the given `target`.
     * `start` and `end` define the range bounds. `start` is inclusive and `end` is exclusive.
     *
     * Target function selectors are not sorted in any particular way, and their ordering may change at any point.
     *
     * It is not necessary to call {getRoleTargetFunctionCount} before calling this function. Using `start = 0` and
     * `end = type(uint256).max` will return every function selector that `roleId` is allowed to call on `target`.
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
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
     * NOTE: This function does not track function selectors for the {ADMIN_ROLE}, since exhaustively tracking
     * all restricted/admin functions is impractical (by default, all restricted functions are assigned to {ADMIN_ROLE}).
     * Therefore, roles assigned as {ADMIN_ROLE} will not have their selectors included in this extension's tracking.
     */
    function _setTargetFunctionRole(address target, bytes4 selector, uint64 roleId) internal virtual override {
        // cache old role ID
        uint64 oldRoleId = getTargetFunctionRole(target, selector);

        // call super
        super._setTargetFunctionRole(target, selector, roleId);

        // update enumerable sets
        if (oldRoleId != ADMIN_ROLE) {
            _roleTargetFunctions[oldRoleId][target].remove(selector);
        }
        if (roleId != ADMIN_ROLE) {
            _roleTargetFunctions[roleId][target].add(selector);
        }
    }
}
