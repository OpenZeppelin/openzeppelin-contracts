pragma solidity ^0.8.20;

import {ERC721Burnable} from "../../../../openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {ERC721} from "../../../../openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

contract MyERC721Burnable is ERC721Burnable {

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {

    }

    //balanceOf
    
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
    //burn
}