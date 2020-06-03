// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../token/ERC1155/ERC1155Burnable.sol";

contract ERC1155BurnableMock is ERC1155Burnable {
    function mint(address to, uint256 id, uint256 value, bytes memory data) public {
        _mint(to, id, value, data);
    }
}
