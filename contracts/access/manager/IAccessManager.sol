// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IAuthority} from "./IAuthority.sol";
import {IManaged} from "./IManaged.sol";
import {Time} from "../../utils/types/Time.sol";

interface IAccessManager is IAuthority {
    enum AccessMode { Custom, Closed, Open }

    // Structure that stores the details for a group/account pair. This structures fit into a single slot.
    struct Access {
        // Timepoint at which the user gets the permission. If this is either 0, or in the future, the group permission
        // are not available. Should be checked using {Time-isSetAndPast}
        Time.Timepoint since;
        // delay for execution. Only applies to restricted() / relay() calls. This does not restrict access to
        // functions that use the `onlyRole` modifier.
        Time.Delay delay;
    }

    // Structure that stores the details of a group, including:
    // - the members of the group
    // - the admin group (that can grant or revoke permissions)
    // - the guardian group (that can cancel operations targeting functions that need this group
    // - the grand delay
    struct Group {
        mapping(address user => Access access) members;
        uint256 admin;
        uint256 guardian;
        Time.Delay delay; // delay for granting
    }

    function getContractMode(address target) external view returns (AccessMode);
    function getFunctionAllowedGroup(address target, bytes4 selector) external view returns (uint256);
    function getGroupAdmin(uint256 group) external view returns (uint256);
    function getGroupGuardian(uint256 group) external view returns (uint256);
    function getAccess(uint256 group, address account) external view returns (Access memory);
    function hasGroup(uint256 group, address account) external view returns (bool);

    function grantRole(uint256 group, address account, uint32 executionDelay) external;
    function revokeRole(uint256 group, address account) external;
    function renounceRole(uint256 group, address callerConfirmation) external;
    function setExecuteDelay(uint256 group, address account, uint32 newDelay) external;
    function setGroupAdmin(uint256 group, uint256 admin) external;
    function setGroupGuardian(uint256 group, uint256 guardian) external;
    function setGrantDelay(uint256 group, uint32 newDelay) external;
    function setContractModeCustom(address target) external;
    function setContractModeOpen(address target) external;
    function setContractModeClosed(address target) external;

    function schedule(address target, bytes calldata data) external returns (bytes32);
    function cancel(address caller, address target, bytes calldata data) external;
    function relay(address target, bytes calldata data) external payable;
    function updateAuthority(IManaged target, address newAuthority) external;
}
