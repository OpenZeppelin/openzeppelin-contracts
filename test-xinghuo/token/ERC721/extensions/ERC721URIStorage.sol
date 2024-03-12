pragma solidity ^0.8.20;

import {ERC721URIStorage} from "../../../../openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "../../../../openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

contract MyERC721URIStorage is ERC721URIStorage {

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {

    }

    //tokenURI

    function SetTokenURI(uint256 tokenId, string memory _tokenURI) public {
        _setTokenURI(tokenId, _tokenURI);
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}