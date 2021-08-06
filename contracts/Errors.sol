// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

// Initializable
error AlreadyInitialized(address instance);

// Ownable
error OwnerRestricted(address instance, address owner, address caller);

// AccessControl
error RoleRestricted(address instance, bytes32 role, address account);

// ReentrancyGuard
error ReentrancyRestricted(address instance);

// Pausable
error PauseRestricted(address instance, bool isPaused);

// Create2 & Minimal Proxy
error CreateFailed();
error Create2Failed();

// TODO
// NotAContract(address instance);
