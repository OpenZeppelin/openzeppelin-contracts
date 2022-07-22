// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC1155/extensions/ERC1155Compatible.sol";

contract ERC1155CompatibleMock is ERC1155Compatible {
    constructor(
        string memory name,
        string memory symbol,
        string memory uri
    ) ERC1155Compatible(name, symbol, uri) {}

    function mint(
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public {
        _mint(to, id, value, data);
    }
}
