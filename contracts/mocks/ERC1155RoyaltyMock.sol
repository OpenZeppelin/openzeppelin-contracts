// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC1155/extensions/ERC1155Royalty.sol";

contract ERC1155RoyaltyMock is ERC1155Royalty {
    constructor(string memory uri) ERC1155(uri) {}

    function setTokenRoyalty(
        uint256 tokenId,
        address recipient,
        uint96 fraction
    ) public {
        _setTokenRoyalty(tokenId, recipient, fraction);
    }

    function setDefaultRoyalty(address recipient, uint96 fraction) public {
        _setDefaultRoyalty(recipient, fraction);
    }

    function mint(
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public {
        _mint(to, id, value, data);
    }

    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) public {
        _burn(from, id, amount);
    }

    function deleteRoyalty() public {
        _deleteDefaultRoyalty();
    }
}
