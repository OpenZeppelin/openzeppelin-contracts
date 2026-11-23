// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {ERC7540} from "./ERC7540.sol";

/**
 * @dev Module for enabling synchronous behavior (ERC-4626) for the deposit flow of an ERC-7540 vault.
 *
 * Note that an ERC-7540 vault is required to have at least one flow operating in asynchronous mode, so this module
 * cannot be combined with {ERC7540SyncRedeem}.
 */
abstract contract ERC7540SyncDeposit is ERC7540 {
    /// @inheritdoc ERC7540
    function _isDepositAsync() internal pure virtual override returns (bool) {
        return false;
    }

    /// @dev Consumes `assets` from the claimable deposit and returns the proportional shares (rounded down).
    function _consumeClaimableDeposit(
        uint256 /*assets*/,
        address /*controller*/
    ) internal virtual override returns (uint256) {
        revert();
    }

    /// @dev Consumes `shares` from the claimable deposit and returns the proportional assets (rounded up).
    function _consumeClaimableMint(
        uint256 /*shares*/,
        address /*controller*/
    ) internal virtual override returns (uint256) {
        revert();
    }

    /// @inheritdoc ERC7540
    function _pendingDepositRequest(
        uint256 /*requestId*/,
        address /*controller*/
    ) internal view virtual override returns (uint256) {
        revert();
    }

    /// @inheritdoc ERC7540
    function _claimableDepositRequest(
        uint256 /*requestId*/,
        address /*controller*/
    ) internal view virtual override returns (uint256) {
        revert();
    }

    /// @inheritdoc ERC7540
    function _asyncMaxDeposit(address /*owner*/) internal view virtual override returns (uint256) {
        revert();
    }

    /// @inheritdoc ERC7540
    function _asyncMaxMint(address /*owner*/) internal view virtual override returns (uint256) {
        revert();
    }

    /// @dev Synchronous flows have no Requests: {_requestDeposit} reverts before using this value.
    function _getDepositRequestId(address /* controller */) internal virtual override returns (uint256) {
        return 0;
    }

    /// @dev Synchronous flows have no Claimable requests.
    function _totalClaimableDepositAssets() internal view virtual override returns (uint256) {
        return 0;
    }

    /// @dev Synchronous flows have no Claimable requests.
    function _totalClaimableDepositShares() internal view virtual override returns (uint256) {
        return 0;
    }
}
