pragma solidity ^0.5.0;

import "../token/ERC721/ERC721Full.sol";
import "../token/ERC721/ERC721Mintable.sol";
import "../token/ERC721/ERC721MetadataMintable.sol";
import "../token/ERC721/ERC721Burnable.sol";

/**
 * @title ERC721FullMock
 * This mock just provides public functions for setting metadata URI, getting all tokens of an owner,
 * checking token existence, removal of a token from an address
 */
contract ERC721FullMock is ERC721Full, ERC721Mintable, ERC721MetadataMintable, ERC721Burnable {
    constructor (string memory name, string memory symbol) public ERC721Mintable() ERC721Full(name, symbol) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        return _tokensOfOwner(owner);
    }

    function setTokenURI(uint256 tokenId, string memory uri) public {
        _setTokenURI(tokenId, uri);
    }

    function setBaseURI(string memory baseURI) public {
        _setBaseURI(baseURI);
    }
}
