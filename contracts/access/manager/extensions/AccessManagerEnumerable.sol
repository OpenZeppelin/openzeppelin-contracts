// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccessManager} from "../AccessManager.sol";
import {EnumerableSet} from "../../../utils/structs/EnumerableSet.sol";

abstract contract AccessManagerEnumerable is AccessManager {
    using EnumerableSet for EnumerableSet.AddressSet;
    mapping(uint64 roleId => EnumerableSet.AddressSet) private _roleMembers;

    function _grantRole(
        uint64 roleId,
        address account,
        uint32 grantDelay,
        uint32 executionDelay
    ) internal override returns (bool) {
        bool granted = super._grantRole(roleId, account, grantDelay, executionDelay);
        if (granted) {
            _roleMembers[roleId].add(account);
        }
        return granted;
    }

    function _revokeRole(uint64 roleId, address account) internal override returns (bool) {
        bool revoked = super._revokeRole(roleId, account);
        if (revoked) {
            _roleMembers[roleId].remove(account);
        }
        return revoked;
    }

    function getRoleMembers(uint64 roleId, uint256 start, uint256 end) public view returns (address[] memory) {
        return _roleMembers[roleId].values(start, end);
    }

    function getRoleMemberCount(uint64 roleId) public view returns (uint256) {
        return _roleMembers[roleId].length();
    }
}
