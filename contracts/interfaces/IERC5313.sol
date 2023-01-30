// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/// @title EIP-5313 Light Contract Ownership Standard
interface IERC5313 {
    /// @notice Get the address of the owner
    /// @return The address of the owner
    function owner() external view returns (address);
}
