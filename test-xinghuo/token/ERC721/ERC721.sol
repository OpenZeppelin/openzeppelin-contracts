pragma solidity ^0.8.20;

import {ERC721} from "../../../openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

contract MyERC721 is ERC721 {

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {

    }

    //balanceOf
    //ownerOf
    //name
    //symbol
    //approve
    //getApproved
    //setApprovalForAll
    //isApprovedForAll
    //transferFrom
    //safeTransferFrom
    
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
    
    function SafeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function Burn(uint256 tokenId) public {
        _burn(tokenId);
    }
}