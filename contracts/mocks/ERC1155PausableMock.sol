// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./ERC1155Mock.sol";
import "../token/ERC1155/ERC1155Pausable.sol";

contract ERC1155PausableMock is ERC1155Mock, ERC1155Pausable {
    constructor(string memory uri) public ERC1155Mock(uri) { }

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    )
        internal virtual override(ERC1155, ERC1155Pausable)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
