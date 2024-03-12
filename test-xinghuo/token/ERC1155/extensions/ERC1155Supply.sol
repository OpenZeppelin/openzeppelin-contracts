pragma solidity ^0.8.20;

import {ERC1155Supply} from "../../../../openzeppelin-contracts/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155} from "../../../../openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";

contract MyERC1155Supply is ERC1155Supply {

    constructor(string memory uri_) ERC1155(uri_) {

    }
    
    //totalSupply
    //totalSupply id
    //exists
    function mint(address to, uint256 id, uint256 value, bytes memory data) public {
        _mint(to, id, value, data);
    }

}