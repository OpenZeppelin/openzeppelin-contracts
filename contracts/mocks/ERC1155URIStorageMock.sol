// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC1155Mock.sol";
import "../token/ERC1155/extensions/ERC1155URIStorage.sol";

contract ERC1155URIStorageMock is ERC1155Mock, ERC1155URIStorage {
    constructor(string memory _uri) ERC1155Mock(_uri) {}

    function uri(uint256 tokenId) public view override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return ERC1155URIStorage.uri(tokenId);
    }

    function setURI(uint256 tokenId, string memory _tokenURI) public {
        _setURI(tokenId, _tokenURI);
    }

    function setBaseURI(string memory baseURI) public {
        _setBaseURI(baseURI);
    }
}
