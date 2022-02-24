// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Provides information for building cross-chain aware contracts. This
 * abstract contract provides accessors and modifiers to control the execution
 * flow when receiving cross-chain messages.
 *
 * Actual implementations of cross-chain aware contracts, which are based on
 * this abstraction, will  have to inherit from a bridge-specific
 * specialisation. Such specializations are provided under
 * `crosschain/<chain>/CrossChainEnabled<chain>.sol`.
 *
 * _Available since v4.6._
 */
abstract contract CrossChainEnabled {
    error NotCrossChainCall();
    error InvalidCrossChainSender(address sender, address expected);

    /**
     * @dev Throws if the current function call is not the result of a
     * cross-chain execution.
     */
    modifier onlyCrossChain() {
        if (!_isCrossChain()) revert NotCrossChainCall();
        _;
    }

    /**
     * @dev Throws if the current function call is not the result of a
     * cross-chain execution initiated by `account`.
     */
    modifier onlyCrossChainSender(address account) {
        address sender = _crossChainSender();
        if (account != sender) revert InvalidCrossChainSender(sender, account);
        _;
    }

    /**
     * @dev Returns weither the current function call is the result of a
     * cross-chain message.
     */
    function _isCrossChain() internal view virtual returns (bool);

    /**
     * @dev Returns the address of the sender of the cross-chain message that
     * triggered the current function call.
     *
     * NOTE: Should revert if the current function call is not the result of a
     * cross-chain message.
     */
    function _crossChainSender() internal view virtual returns (address);
}
