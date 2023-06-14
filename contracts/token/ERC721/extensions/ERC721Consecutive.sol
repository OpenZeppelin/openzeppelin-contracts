// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC721/extensions/ERC721Consecutive.sol)

pragma solidity ^0.8.19;

import "../ERC721.sol";
import "../../../interfaces/IERC2309.sol";
import "../../../utils/structs/BitMaps.sol";
import "../../../utils/structs/Checkpoints.sol";

/**
 * @dev Implementation of the ERC2309 "Consecutive Transfer Extension" as defined in
 * https://eips.ethereum.org/EIPS/eip-2309[EIP-2309].
 *
 * This extension allows the minting of large batches of tokens, during contract construction only. For upgradeable
 * contracts this implies that batch minting is only available during proxy deployment, and not in subsequent upgrades.
 * These batches are limited to 5000 tokens at a time by default to accommodate off-chain indexers.
 *
 * Using this extension removes the ability to mint single tokens during contract construction. This ability is
 * regained after construction. During construction, only batch minting is allowed.
 *
 * IMPORTANT: This extension bypasses the hooks {_beforeTokenTransfer} and {_afterTokenTransfer} for tokens minted in
 * batch. The hooks will be only called once per batch, so you should take `batchSize` parameter into consideration
 * when relying on hooks.
 *
 * IMPORTANT: When overriding {_afterTokenTransfer}, be careful about call ordering. {ownerOf} may return invalid
 * values during the {_afterTokenTransfer} execution if the super call is not called first. To be safe, execute the
 * super call before your custom logic.
 *
 * _Available since v4.8._
 */
abstract contract ERC721Consecutive is IERC2309, ERC721 {
    using BitMaps for BitMaps.BitMap;
    using Checkpoints for Checkpoints.Trace160;

    Checkpoints.Trace160 private _sequentialOwnership;
    BitMaps.BitMap private _sequentialBurn;

    /**
     * @dev Batch mint is restricted to the constructor.
     * Any batch mint not emitting the {IERC721-Transfer} event outside of the constructor
     * is non-ERC721 compliant.
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
     * CAUTION: Does not emit a `Transfer` event. This is ERC721 compliant as long as it is done inside of the
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

            // hook before
            _beforeTokenTransfer(address(0), to, next, batchSize);

            // push an ownership checkpoint & emit event
            uint96 last = next + batchSize - 1;
            _sequentialOwnership.push(last, uint160(to));

            // The invariant required by this function is preserved because the new sequentialOwnership checkpoint
            // is attributing ownership of `batchSize` new tokens to account `to`.
            __unsafe_increaseBalance(to, batchSize);

            emit ConsecutiveTransfer(next, last, address(0), to);

            // hook after
            _afterTokenTransfer(address(0), to, next, batchSize);
        }

        return next;
    }

    /**
     * @dev See {ERC721-_mint}. Override version that restricts normal minting to after construction.
     *
     * WARNING: Using {ERC721Consecutive} prevents using {_mint} during construction in favor of {_mintConsecutive}.
     * After construction, {_mintConsecutive} is no longer available and {_mint} becomes available.
     */
    function _mint(address to, uint256 tokenId) internal virtual override {
        if (address(this).code.length == 0) {
            revert ERC721ForbiddenMint();
        }
        super._mint(to, tokenId);
    }

    /**
     * @dev See {ERC721-_afterTokenTransfer}. Burning of tokens that have been sequentially minted must be explicit.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override {
        if (
            to == address(0) && // if we burn
            firstTokenId >= _firstConsecutiveId() &&
            firstTokenId < _nextConsecutiveId() &&
            !_sequentialBurn.get(firstTokenId)
        ) // and the token was never marked as burnt
        {
            if (batchSize != 1) {
                revert ERC721ForbiddenBatchBurn();
            }
            _sequentialBurn.set(firstTokenId);
        }
        super._afterTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /**
     * @dev Used to offset the first token id in {_nextConsecutiveId}
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
