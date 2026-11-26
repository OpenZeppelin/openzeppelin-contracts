// contracts/MyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity >0.8.999 <0.10.0;

import {ERC721} from "../../token/ERC721/ERC721.sol";

contract MyNFT is ERC721 {
    constructor() ERC721("MyNFT", "MNFT") {}
}
