// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPausable
/// @notice Declares pause/unpause events
/// @dev Interface declaring Paused and Unpaused events
interface IPausable {
    event Paused(address account);
    event Unpaused(address account);
}
