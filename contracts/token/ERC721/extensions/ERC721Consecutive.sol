// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (token/ERC721/extensions/ERC721Consecutive.sol)

pragma solidity ^0.8.24;

import {ERC721} from "../ERC721.sol";
import {IERC2309} from "../../../interfaces/IERC2309.sol";
import {BitMaps} from "../../../utils/structs/BitMaps.sol";
import {Checkpoints} from "../../../utils/structs/Checkpoints.sol";

/**
 * @dev Implementation of the ERC-2309 "Consecutive Transfer Extension" as defined in
 * https://eips.ethereum.org/EIPS/eip-2309[ERC-2309].
 *
 * This extension allows the minting of large batches of tokens, during contract construction only. For upgradeable
 * contracts this implies that batch minting is only available during proxy deployment, and not in subsequent upgrades.
 * These batches are limited to 5000 tokens at a time by default to accommodate off-chain indexers.
 *
 * Using this extension removes the ability to mint single tokens during contract construction. This ability is
 * regained after construction. During construction, only batch minting is allowed.
 *
 * IMPORTANT: This extension does not call the {_update} function for tokens minted in batch. Any logic added to this
 * function through overrides will not be triggered when tokens are minted in batch. You may want to also override
 * {_increaseBalance} or {_mintConsecutive} to account for these mints.
 *
 * IMPORTANT: When overriding {_mintConsecutive}, be careful about call ordering. {ownerOf} may return invalid
 * values during the {_mintConsecutive} execution if the super call is not called first. To be safe, execute the
 * super call before your custom logic.
 */
abstract contract ERC721Consecutive is IERC2309, ERC721 {
    using BitMaps for BitMaps.BitMap;
    using Checkpoints for Checkpoints.Trace160;

    Checkpoints.Trace160 private _sequentialOwnership;
    BitMaps.BitMap private _sequentialBurn;

    /**
     * @dev Batch mint is restricted to the constructor.
     * Any batch mint not emitting the {IERC721-Transfer} event outside of the constructor
     * is non ERC-721 compliant.
     */
    error ERC721ForbiddenBatchMint();

    /**
     * @dev Exceeds the max amount of mints per batch.
     */
    error ERC721ExceededMaxBatchMint(uint256 batchSize, uint256 maxBatch);

    /**
     * @dev Individual minting is not allowed.
     */
    error ERC721ForbiddenMint();

    /**
     * @dev Batch burn is not supported.
     */
    error ERC721ForbiddenBatchBurn();

    /**
     * @dev Maximum size of a batch of consecutive tokens. This is designed to limit stress on off-chain indexing
     * services that have to record one entry per token, and have protections against "unreasonably large" batches of
     * tokens.
     *
     * NOTE: Overriding the default value of 5000 will not cause on-chain issues, but may result in the asset not being
     * correctly supported by off-chain indexing services (including marketplaces).
     */
    function _maxBatchSize() internal view virtual returns (uint96) {
        return 5000;
    }

    /**
     * @dev See {ERC721-_ownerOf}. Override that checks the sequential ownership structure for tokens that have
     * been minted as part of a batch, and not yet transferred.
     */
    function _ownerOf(uint256 tokenId) internal view virtual override returns (address) {
        address owner = super._ownerOf(tokenId);

        // If token is owned by the core, or beyond consecutive range, return base value
        if (owner != address(0) || tokenId > type(uint96).max || tokenId < _firstConsecutiveId()) {
            return owner;
        }

        // Otherwise, check the token was not burned, and fetch ownership from the anchors
        // Note: no need for safe cast, we know that tokenId <= type(uint96).max
        return _sequentialBurn.get(tokenId) ? address(0) : address(_sequentialOwnership.lowerLookup(uint96(tokenId)));
    }

    /**
     * @dev Mint a batch of tokens of length `batchSize` for `to`. Returns the token id of the first token minted in the
     * batch; if `batchSize` is 0, returns the number of consecutive ids minted so far.
     *
     * Requirements:
     *
     * - `batchSize` must not be greater than {_maxBatchSize}.
     * - The function is called in the constructor of the contract (directly or indirectly).
     *
     * CAUTION: Does not emit a `Transfer` event. This is ERC-721 compliant as long as it is done inside of the
     * constructor, which is enforced by this function.
     *
     * CAUTION: Does not invoke `onERC721Received` on the receiver.
     *
     * Emits a {IERC2309-ConsecutiveTransfer} event.
     */
    function _mintConsecutive(address to, uint96 batchSize) internal virtual returns (uint96) {
        uint96 next = _nextConsecutiveId();

        // minting a batch of size 0 is a no-op
        if (batchSize > 0) {
            if (address(this).code.length > 0) {
                revert ERC721ForbiddenBatchMint();
            }
            if (to == address(0)) {
                revert ERC721InvalidReceiver(address(0));
            }

            uint256 maxBatchSize = _maxBatchSize();
            if (batchSize > maxBatchSize) {
                revert ERC721ExceededMaxBatchMint(batchSize, maxBatchSize);
            }

            // push an ownership checkpoint & emit event
            uint96 last = next + batchSize - 1;
            _sequentialOwnership.push(last, uint160(to));

            // The invariant required by this function is preserved because the new sequentialOwnership checkpoint
            // is attributing ownership of `batchSize` new tokens to account `to`.
            _increaseBalance(to, batchSize);

            emit ConsecutiveTransfer(next, last, address(0), to);
        }

        return next;
    }

    /**
     * @dev See {ERC721-_update}. Override version that restricts normal minting to after construction.
     *
     * WARNING: Using {ERC721Consecutive} prevents minting during construction in favor of {_mintConsecutive}.
     * After construction, {_mintConsecutive} is no longer available and minting through {_update} becomes available.
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);

        // only mint after construction
        if (previousOwner == address(0) && address(this).code.length == 0) {
            revert ERC721ForbiddenMint();
        }

        // record burn
        if (
            to == address(0) && // if we burn
            tokenId < _nextConsecutiveId() && // and the tokenId was minted in a batch
            !_sequentialBurn.get(tokenId) // and the token was never marked as burnt
        ) {
            _sequentialBurn.set(tokenId);
        }

        return previousOwner;
    }

    /**
     * @dev Used to offset the first token id in `_nextConsecutiveId`
     */
    function _firstConsecutiveId() internal view virtual returns (uint96) {
        return 0;
    }

    /**
     * @dev Returns the next tokenId to mint using {_mintConsecutive}. It will return {_firstConsecutiveId}
     * if no consecutive tokenId has been minted before.
     */
    function _nextConsecutiveId() private view returns (uint96) {
        (bool exists, uint96 latestId, ) = _sequentialOwnership.latestCheckpoint();
        return exists ? latestId + 1 : _firstConsecutiveId();
    }
}
