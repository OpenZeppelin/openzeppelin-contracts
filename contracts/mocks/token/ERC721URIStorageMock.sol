// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC721/extensions/ERC721URIStorage.sol";

abstract contract ERC721URIStorageMock is ERC721URIStorage {
    string private _baseTokenURI;

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function getPureTokenURI(uint256 tokenId) internal view returns (string memory) {
        return _getPureTokenURI(tokenId);
    }

    function setBaseURI(string calldata newBaseTokenURI) public {
        _baseTokenURI = newBaseTokenURI;
    }
}
