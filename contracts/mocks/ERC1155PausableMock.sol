// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC1155Mock.sol";
import "../token/ERC1155/extensions/ERC1155Pausable.sol";

contract ERC1155PausableMock is ERC1155Mock, ERC1155Pausable {
    constructor(string memory uri) ERC1155Mock(uri) {}

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }
}
