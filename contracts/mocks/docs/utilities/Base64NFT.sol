// contracts/Base64NFT.sol
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC721} from "../../../token/ERC721/ERC721.sol";
import {Strings} from "../../../utils/Strings.sol";
import {Base64} from "../../../utils/Base64.sol";

contract Base64NFT is ERC721 {
    using Strings for uint256;

    constructor() ERC721("Base64NFT", "MTK") {}

    // ...

    function tokenURI(uint256 tokenId)
        public
        pure
        override
        returns (string memory)
    {
        bytes memory dataURI = abi.encodePacked(
            '{',
                '"name": "Base64NFT #', tokenId.toString(), '"',
                // Replace with extra ERC-721 Metadata properties
            '}'
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(dataURI)
            )
        );
    }
}
