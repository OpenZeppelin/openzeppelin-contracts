// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC721.sol";
import "../../../utils/Checkpoints.sol";
import "../../../utils/math/SafeCast.sol";
import "../../../utils/structs/BitMaps.sol";

/**
 * @dev Implementation of the ERC2309 "Consecutive Transfer Extension" as defined in
 * https://eips.ethereum.org/EIPS/eip-2309[EIP-2309].
 *
 * This extension allows the minting of large batches of tokens during the contract construction. These batches are
 * limited to 5000 tokens at a time to accommodate off-chain indexers.
 *
 * Using this extensions removes the ability to mint single token during the contract construction. This ability is
 * regained after construction. During construction, only batch minting is allowed.
 *
 * IMPORTANT: This extension bypasses the hooks `_beforeTokenTransfer` and `_afterTokenTransfer`
 *
 * _Available since v4.8._
 */
abstract contract ERC721Consecutive is ERC721 {
    using BitMaps for BitMaps.BitMap;
    using Checkpoints for Checkpoints.Trace160;

    Checkpoints.Trace160 private _sequentialOwnership;
    BitMaps.BitMap private _sequentialBurn;

    event ConsecutiveTransfer(
        uint256 indexed fromTokenId,
        uint256 toTokenId,
        address indexed fromAddress,
        address indexed toAddress
    );

    /**
     * @dev See {ERC721-_ownerOf}. Override version that checks the sequential ownership structure for tokens that have
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
     * @dev Mint a batch of token of length `batchSize` for `to`.
     *
     * WARNING: Consecutive mint is only available during construction. ERC721 requires that any minting done after
     * construction emits a Transfer event, which is not the case of mints performed using this function.
     *
     * WARNING: Consecutive mint is limited to batches of 5000 tokens. Further minting is possible from a contract's
     * point of view but would cause indexing issues for off-chain services.
     *
     * Emits a {ConsecutiveTransfer} event.
     */
    function _mintConsecutive(address to, uint96 batchSize) internal virtual {
        // minting a batch of size 0 is a no-op
        if (batchSize == 0) return;

        require(!Address.isContract(address(this)), "ERC721Consecutive: batch minting restricted to constructor");
        require(to != address(0), "ERC721Consecutive: mint to the zero address");
        require(batchSize < 5000, "ERC721Consecutive: batches too large for indexing");

        uint96 first = _totalConsecutiveSupply();
        uint96 last = first + batchSize - 1;

        // hook before
        _beforeConsecutiveTokenTransfer(address(0), to, first, last);

        // push an ownership checkpoint & emit event
        _sequentialOwnership.push(SafeCast.toUint96(last), uint160(to));
        emit ConsecutiveTransfer(first, last, address(0), to);

        // hook after
        _afterConsecutiveTokenTransfer(address(0), to, first, last);
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
        if (_sequentialBurn.get(tokenId)) {
            _sequentialBurn.unset(tokenId);
        }
    }

    /**
     * @dev See {ERC721-_mint}. Override needed to avoid looking up in the sequential ownership structure for burnt
     * token.
     */
    function _burn(uint256 tokenId) internal virtual override {
        // Invoke the core burn functionality to adjust balances, invoke hooks, etc.
        super._burn(tokenId);
        if (tokenId <= _totalConsecutiveSupply()) {
            _sequentialBurn.set(tokenId);
        }
    }

    function _totalConsecutiveSupply() private view returns (uint96) {
        uint256 length = _sequentialOwnership._checkpoints.length;
        return length == 0 ? 0 : _sequentialOwnership._checkpoints[length - 1]._key + 1;
    }
}
