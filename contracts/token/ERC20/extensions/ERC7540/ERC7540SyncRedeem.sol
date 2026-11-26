// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {ERC7540} from "./ERC7540.sol";

/**
 * @dev Module for enabling synchronous behavior (ERC-4626) for the redeem flow of an ERC-7540 vault.
 *
 * Note that an ERC-7540 vault is required to have at least one flow operating in asynchronous mode, so this module
 * cannot be combined with {ERC7540SyncDeposit}.
 */
abstract contract ERC7540SyncRedeem is ERC7540 {
    /// @inheritdoc ERC7540
    function _isRedeemAsync() internal pure virtual override returns (bool) {
        return false;
    }

    /// @dev Consumes `assets` from the claimable redeem and returns the proportional shares (rounded up).
    function _consumeClaimableWithdraw(
        uint256 /*assets*/,
        address /*controller*/
    ) internal virtual override returns (uint256) {
        revert();
    }

    /// @dev Consumes `shares` from the claimable redeem and returns the proportional assets (rounded down).
    function _consumeClaimableRedeem(
        uint256 /*shares*/,
        address /*controller*/
    ) internal virtual override returns (uint256) {
        revert();
    }

    /// @inheritdoc ERC7540
    function _pendingRedeemRequest(
        uint256 /*requestId*/,
        address /*controller*/
    ) internal view virtual override returns (uint256) {
        revert();
    }

    /// @inheritdoc ERC7540
    function _claimableRedeemRequest(
        uint256 /*requestId*/,
        address /*controller*/
    ) internal view virtual override returns (uint256) {
        revert();
    }

    /// @inheritdoc ERC7540
    function _asyncMaxWithdraw(address /*owner*/) internal view virtual override returns (uint256) {
        revert();
    }

    /// @inheritdoc ERC7540
    function _asyncMaxRedeem(address /*owner*/) internal view virtual override returns (uint256) {
        revert();
    }

    /// @dev Synchronous flows have no Requests: {_requestRedeem} reverts before using this value.
    function _getRedeemRequestId(address /* controller */) internal virtual override returns (uint256) {
        return 0;
    }

    /// @dev Synchronous flows have no Claimable requests.
    function _totalClaimableRedeemAssets() internal view virtual override returns (uint256) {
        return 0;
    }

    /// @dev Synchronous flows have no Claimable requests.
    function _totalClaimableRedeemShares() internal view virtual override returns (uint256) {
        return 0;
    }
}
