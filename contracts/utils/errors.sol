// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.7.0 (utils/errors.sol)

pragma solidity ^0.8.4;

/**
 * @dev Error that occurs when the contract creation failed.
 * @param emitter The contract that emits the error.
 */
error Failed(address emitter);

/**
 * @dev Error that occurs when the factory contract has insufficient balance.
 * @param emitter The contract that emits the error.
 */
error InsufficientBalance(address emitter);

/**
 * @dev Error that occurs when the bytecode length is zero.
 * @param emitter The contract that emits the error.
 */
error ZeroBytecodeLength(address emitter);
