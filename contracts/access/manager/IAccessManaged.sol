// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0-rc.0) (access/manager/IAccessManaged.sol)

pragma solidity ^0.8.20;

interface IAccessManaged {
    event AuthorityUpdated(address authority);

    error AccessManagedUnauthorized(address caller);
    error AccessManagedRequiredDelay(address caller, uint32 delay);
    error AccessManagedInvalidAuthority(address authority);

    function authority() external view returns (address);

    function setAuthority(address) external;

    function isConsumingScheduledOp() external view returns (bytes4);
}
