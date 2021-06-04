// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC1155/extensions/ERC1155Enumerable.sol";
import "../token/ERC1155/extensions/ERC1155Burnable.sol";

contract ERC1155EnumerableMock is ERC1155Enumerable, ERC1155Burnable {
    constructor(string memory uri) ERC1155(uri) { }

    function mint(address to, uint256 id, uint256 value, bytes memory data) public {
        _mint(to, id, value, data);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    )
        internal
        virtual
        override(ERC1155, ERC1155Enumerable)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
