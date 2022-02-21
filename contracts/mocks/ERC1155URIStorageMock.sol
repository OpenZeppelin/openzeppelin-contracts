// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC1155Mock.sol";
import "../token/ERC1155/extensions/ERC1155URIStorage.sol";

contract ERC1155URIStorageMock is ERC1155Mock, ERC1155URIStorage {
    constructor(string memory uri) ERC1155Mock(uri) {}

    // fixes: Derived contract must override function "_beforeTokenTransfer". Two or more base classes define function with same name and parameter types.
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        _setTokenURI(tokenId, _tokenURI);
    }
}
