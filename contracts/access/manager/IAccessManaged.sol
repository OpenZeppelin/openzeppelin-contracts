// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface IAccessManaged {
    event AuthorityUpdated(address authority);

    error AccessManagedUnauthorized(address caller);
    error AccessManagedRequiredDelay(address caller, uint32 delay);
    error AccessManagedInvalidAuthority(address authority);

    function authority() external view returns (address);

    function setAuthority(address) external;

    function isConsumingScheduledOp() external view returns (bool);
}
