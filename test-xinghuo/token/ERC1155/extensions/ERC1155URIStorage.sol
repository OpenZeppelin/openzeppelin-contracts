pragma solidity ^0.8.20;

import {ERC1155URIStorage} from "../../../../openzeppelin-contracts/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import {ERC1155} from "../../../../openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";

contract MyERC1155URIStorage is ERC1155URIStorage {

    constructor(string memory uri_) ERC1155(uri_) {

    }
    
    //uri -id 
    //
    function mint(address to, uint256 id, uint256 value, bytes memory data) public {
        _mint(to, id, value, data);
    }

    function SetBaseURI(string memory baseURI) public {
        _setBaseURI(baseURI);
    }

    function SetURI(uint256 tokenId, string memory tokenURI) public {
        _setURI(tokenId, tokenURI);
    }
}