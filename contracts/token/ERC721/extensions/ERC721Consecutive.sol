// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC721/extensions/ERC721Burnable.sol)

pragma solidity ^0.8.0;

import "../ERC721.sol";
import "../../../utils/Checkpoints.sol";
import "../../../utils/math/SafeCast.sol";
import "../../../utils/structs/BitMaps.sol";

/**
 * @title ERC721 Cheap sequential minting
 */
abstract contract ERC721Consecutive is ERC721 {
    using BitMaps for BitMaps.BitMap;
    using Checkpoints for Checkpoints.Checkpoint160[];

    Checkpoints.Checkpoint160[] private _sequentialOwnership;
    BitMaps.BitMap private _sequentialBurn;

    event ConsecutiveTransfer(
        uint256 indexed fromTokenId,
        uint256 toTokenId,
        address indexed fromAddress,
        address indexed toAddress
    );

    constructor(address[] memory receivers, uint96[] memory amounts) {
        // Check input length
        uint256 length = receivers.length;
        require(length == amounts.length);

        // For each batch of token
        for (uint256 i = 0; i < length; ++i) {
            _mintConsecutive(receivers[i], amounts[i]);
        }
    }

    function _ownerOf(uint256 tokenId) internal view virtual override returns (address) {
        address owner = super._ownerOf(tokenId);

        // If token is owned by the core, or beyound consecutive range, return base value
        if (owner != address(0) || tokenId > type(uint96).max) {
            return owner;
        }

        // Otherwize, check the token was not burned, and fetch ownership from the anchors
        // Note: no need for safe cast, we know that tokenId <= type(uint96).max
        return
            _sequentialBurn.get(tokenId)
                ? address(0)
                : address(_sequentialOwnership.lowerLookup(uint96(tokenId)));
    }

    function _mintConsecutive(address to, uint96 batchSize) internal virtual {
        require(!Address.isContract(address(this)), "ERC721Consecutive: batch minting restricted to constructor");

        require(to != address(0), "ERC721Consecutive: mint to the zero address");
        require(batchSize > 0, "ERC721Consecutive: empty batch");
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

    function _mint(address to, uint256 tokenId) internal virtual override {
        // During construction, minting should only be performed using the batch mechanism.
        // This is necessary because interleaving mint and batchmint would cause issues.
        require(Address.isContract(address(this)), "ERC721Consecutive: cant mint durring construction");

        super._mint(to, tokenId);
        if (_sequentialBurn.get(tokenId)) {
            _sequentialBurn.unset(tokenId);
        }
    }

    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);
        if (tokenId <= _totalConsecutiveSupply()) {
            _sequentialBurn.set(tokenId);
        }
    }

    function _totalConsecutiveSupply() private view returns (uint96) {
        uint256 length = _sequentialOwnership.length;
        return length == 0 ? 0 : _sequentialOwnership[length - 1]._key + 1;
    }
}
