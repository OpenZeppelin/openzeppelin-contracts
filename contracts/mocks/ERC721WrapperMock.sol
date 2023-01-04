// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/ERC721Wrapper.sol";

contract ERC721WrapperMock is ERC721Wrapper {
    constructor(
        IERC721 _underlyingToken,
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) ERC721Wrapper(_underlyingToken) {}
}
