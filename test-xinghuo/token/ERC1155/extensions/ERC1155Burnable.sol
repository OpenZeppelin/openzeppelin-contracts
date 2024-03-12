pragma solidity ^0.8.20;

import {ERC1155Burnable} from "../../../../openzeppelin-contracts/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {ERC1155} from "../../../../openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";

contract MyERC1155Burnable is ERC1155Burnable {

    constructor(string memory uri_) ERC1155(uri_) {

    }

    //balanceOf
    
    function mint(address to, uint256 id, uint256 value, bytes memory data) public {
        _mint(to, id, value, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory values, bytes memory data) public {
        _mintBatch(to, ids, values, data);
    }

    //burn
    //burnBatch
}