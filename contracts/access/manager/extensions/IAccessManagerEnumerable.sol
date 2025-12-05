// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4;

import {IAccessManager} from "../IAccessManager.sol";

/**
 * @dev External interface of AccessManagerEnumerable.
 */
interface IAccessManagerEnumerable is IAccessManager {
    /**
     * @dev Returns one of the accounts that have `roleId`. `index` must be a
     * value between 0 and {getRoleMemberCount}, non-inclusive.
     *
     * Role bearers are not sorted in any particular way, and their ordering may
     * change at any point.
     *
     * WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
     * you perform all queries on the same block. See the following
     * https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
     * for more information.
     */
    function getRoleMember(uint64 roleId, uint256 index) external view returns (address);

    /**
     * @dev Returns a range of accounts that have `roleId`. `start` and `end` define the range bounds.
     * `start` is inclusive and `end` is exclusive.
     *
     * Role bearers are not sorted in any particular way, and their ordering may
     * change at any point.
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function getRoleMembers(uint64 roleId, uint256 start, uint256 end) external view returns (address[] memory);

    /**
     * @dev Returns the number of accounts that have `roleId`. Can be used
     * together with {getRoleMember} to enumerate all bearers of a role.
     */
    function getRoleMemberCount(uint64 roleId) external view returns (uint256);

    /**
     * @dev Returns one of the target function selectors that require `roleId` for the given `target`.
     * `index` must be a value between 0 and {getRoleTargetFunctionCount}, non-inclusive.
     *
     * Target function selectors are not sorted in any particular way, and their ordering may
     * change at any point.
     *
     * WARNING: When using {getRoleTargetFunction} and {getRoleTargetFunctionCount}, make sure
     * you perform all queries on the same block. See the following
     * https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
     * for more information.
     */
    function getRoleTargetFunction(uint64 roleId, address target, uint256 index) external view returns (bytes4);

    /**
     * @dev Returns a range of target function selectors that require `roleId` for the given `target`.
     * `start` and `end` define the range bounds. `start` is inclusive and `end` is exclusive.
     *
     * Target function selectors are not sorted in any particular way, and their ordering may
     * change at any point.
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function getRoleTargetFunctions(
        uint64 roleId,
        address target,
        uint256 start,
        uint256 end
    ) external view returns (bytes4[] memory);

    /**
     * @dev Returns the number of target function selectors that require `roleId` for the given `target`.
     * Can be used together with {getRoleTargetFunction} to enumerate all target functions for a role on a specific target.
     */
    function getRoleTargetFunctionCount(uint64 roleId, address target) external view returns (uint256);
}
