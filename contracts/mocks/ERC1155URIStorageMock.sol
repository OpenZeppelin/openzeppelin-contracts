// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC1155Mock.sol";
import "../token/ERC1155/extensions/ERC1155URIStorage.sol";

contract ERC1155URIStorageMock is ERC1155Mock, ERC1155URIStorage {
    constructor(string memory uri) ERC1155Mock(uri) {}

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        _setTokenURI(tokenId, _tokenURI);
    }
}
