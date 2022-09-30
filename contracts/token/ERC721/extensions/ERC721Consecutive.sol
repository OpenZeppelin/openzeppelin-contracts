// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC721.sol";
import "../../../interfaces/IERC2309.sol";
import "../../../utils/Checkpoints.sol";
import "../../../utils/structs/BitMaps.sol";

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
 * batch. When using this extension, you should consider the {_beforeConsecutiveTokenTransfer} and
 * {_afterConsecutiveTokenTransfer} hooks in addition to {_beforeTokenTransfer} and {_afterTokenTransfer}.
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
        if (owner != address(0) || tokenId > type(uint96).max) {
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
     * CAUTION: Does not emit a `Transfer` event. This is ERC721 compliant as long as it is done outside of the
     * constructor, which is enforced by this function.
     *
     * CAUTION: Does not invoke `onERC721Received` on the receiver.
     *
     * Emits a {IERC2309-ConsecutiveTransfer} event.
     */
    function _mintConsecutive(address to, uint96 batchSize) internal virtual returns (uint96) {
        uint96 first = _totalConsecutiveSupply();

        // minting a batch of size 0 is a no-op
        if (batchSize > 0) {
            require(!Address.isContract(address(this)), "ERC721Consecutive: batch minting restricted to constructor");
            require(to != address(0), "ERC721Consecutive: mint to the zero address");
            require(batchSize <= _maxBatchSize(), "ERC721Consecutive: batch too large");

            // hook before
            _beforeConsecutiveTokenTransfer(address(0), to, first, batchSize);

            // push an ownership checkpoint & emit event
            uint96 last = first + batchSize - 1;
            _sequentialOwnership.push(last, uint160(to));
            emit ConsecutiveTransfer(first, last, address(0), to);

            // hook after
            _afterConsecutiveTokenTransfer(address(0), to, first, batchSize);
        }

        return first;
    }

    /**
     * @dev See {ERC721-_mint}. Override version that restricts normal minting to after construction.
     *
     * Warning: Using {ERC721Consecutive} prevents using {_mint} during construction in favor of {_mintConsecutive}.
     * After construction, {_mintConsecutive} is no longer available and {_mint} becomes available.
     */
    function _mint(address to, uint256 tokenId) internal virtual override {
        require(Address.isContract(address(this)), "ERC721Consecutive: can't mint during construction");
        super._mint(to, tokenId);
    }

    /**
     * @dev See {ERC721-_afterTokenTransfer}. Burning of tokens that have been sequentially minted must be explicit.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        if (
            to == address(0) && // if we burn
            tokenId < _totalConsecutiveSupply() && // and the tokenId was minted in a batch
            !_sequentialBurn.get(tokenId) // and the token was never marked as burnt
        ) {
            _sequentialBurn.set(tokenId);
        }
        super._afterTokenTransfer(from, to, tokenId);
    }

    function _totalConsecutiveSupply() private view returns (uint96) {
        (bool exists, uint96 latestId, ) = _sequentialOwnership.latestCheckpoint();
        return exists ? latestId + 1 : 0;
    }
}
