// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0; 

import "../token/ERC4907/ERC4907.sol";

contract ERC4907Mock is ERC4907 {

    constructor(string memory name_, string memory symbol_)
     ERC4907(name_,symbol_)
     {         
     }

    function mint(uint256 tokenId, address to) public {
        _mint(to, tokenId);
    }

} 

