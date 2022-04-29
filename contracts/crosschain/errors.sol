// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (crosschain/errors.sol)

pragma solidity ^0.8.4;

/**
 * @dev Error that occurs when a function call is not the result of
 * a cross-chain message.
 * @param emitter The contract that emits the error.
 */
error NotCrossChainCall(address emitter);

/**
 * @dev Error that occurs when a function call is not the result of
 * a cross-chain execution initiated by `account`.
 * @param emitter The contract that emits the error.
 * @param actual The actual address that initiated the cross-chain execution.
 * @param expected The expected address that is allowed to initiate the cross-chain execution.
 */
error InvalidCrossChainSender(address emitter, address actual, address expected);
