// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (interfaces/IEntryPointExtra.sol)

pragma solidity >=0.8.4;

import {PackedUserOperation} from "./IERC4337.sol";

/// @dev This is available on all entrypoint since v0.4.0, but is not formally part of the ERC.
interface IEntryPointExtra {
    function getUserOpHash(PackedUserOperation calldata userOp) external view returns (bytes32);
}
