// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface IManaged {
    event AuthorityUpdated(address authority);

    error AccessManagedUnauthorized(address caller);
    error AccessManagedInvalidAuthority(address authority);

    function authority() external view returns (address);

    function setAuthority(address) external;
}
