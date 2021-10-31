// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/draft-ERC721Permit.sol";

contract ERC721PermitMock is ERC721Permit {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 tokenId
    ) payable ERC721(name, symbol) ERC721Permit(name) {
        _mint(initialAccount, tokenId);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
}
