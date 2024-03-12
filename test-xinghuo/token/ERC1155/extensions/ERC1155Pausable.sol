pragma solidity ^0.8.20;

import {ERC1155Pausable} from "../../../../openzeppelin-contracts/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {ERC1155} from "../../../../openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";

contract MyERC1155Pausable is ERC1155Pausable {

    constructor(string memory uri_) ERC1155(uri_) {

    }
    
    function mint(address to, uint256 id, uint256 value, bytes memory data) public {
        _mint(to, id, value, data);
    }

    function Pause() public {
        _pause();
    }

    function Unpause() public {
        _unpause();
    }

}