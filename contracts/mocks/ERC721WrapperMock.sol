// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/ERC721Wrapper.sol";

contract ERC721WrapperMock is ERC721Wrapper {
    constructor(
        IERC721 _underlyingToken,
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) ERC721Wrapper(_underlyingToken) {}

    function recover(address account, uint256 tokenId) public returns (uint256) {
        return _recover(account, tokenId);
    }

    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public {
        _safeMint(to, tokenId, _data);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }
}
