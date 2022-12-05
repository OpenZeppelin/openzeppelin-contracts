// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC1155Mock.sol";
import "../token/ERC1155/extensions/ERC1155Supply.sol";

contract ERC1155SupplyMock is ERC1155Mock, ERC1155Supply {
    constructor(string memory uri) ERC1155Mock(uri) {}
}
