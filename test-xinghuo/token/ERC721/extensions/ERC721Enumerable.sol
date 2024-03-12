pragma solidity ^0.8.20;

import {ERC721Enumerable} from "../../../../openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721} from "../../../../openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

contract MyERC721Enumerable is ERC721Enumerable {

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {

    }

    //tokenOfOwnerByIndex
    //totalSupply
    //tokenByIndex
    //balanceOf
    //ownerOf

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}