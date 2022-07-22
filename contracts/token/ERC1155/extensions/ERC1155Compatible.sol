// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC1155/extensions/ERC1155URIStorage.sol)

pragma solidity ^0.8.0;

import "../../../utils/Strings.sol";
import "../ERC1155.sol";

/**
 * @dev ERC1155 token compatible with blockchain explorers, wallets, and marketplaces.
 *
 */
abstract contract ERC1155Compatible is ERC1155 {
    using Strings for uint256;

    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    // Optional base URI
    string private _baseURI = "";

    /**
     * @dev Create a Compatible ERC1155
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_
    ) ERC1155(baseURI_) {
        _name = name_;
        _symbol = symbol_;
        _baseURI = baseURI_;
    }

    /**
     * @dev Return the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Return the symbol of the token.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev See {IERC1155MetadataURI-uri}.
     *
     * Return a compatible metadata URI, unique for each token.
     */
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        string memory baseURI = _baseURI;

        // If token URI is set, concatenate base URI and tokenURI (via abi.encodePacked).
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    /**
     * @dev Sets `baseURI` as the `_baseURI` for all tokens
     */
    function _setBaseURI(string memory baseURI) internal virtual {
        _baseURI = baseURI;
    }
}
