// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/draft-ERC721Royalty.sol";

contract ERC721RoyaltyMock is ERC721Royalty {
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    constructor() public {}

    function setTokenRoyalty(
        uint256 tokenId,
        address recipient,
        uint256 fraction
    ) public {
        _setTokenRoyalty(tokenId, recipient, fraction);
    }

    function setGlobalRoyalty(address recipient, uint256 fraction) public {
        _setGlobalRoyalty(recipient, fraction);
    }
}
