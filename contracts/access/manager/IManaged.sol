// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface IManaged {
    event AuthorityUpdated(address newAuthority);

    error AccessManagedUnauthorized(address caller);

    function authority() external view returns (address);

    function updateAuthority(address) external;
}
