pragma solidity ^0.8.20;

import {ERC721Pausable} from "../../../../openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {ERC721} from "../../../../openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

contract MyERC721Pausable is ERC721Pausable {

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {

    }


    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function Pause() public {
        _pause();
    }

    function Unpause() public {
        _unpause();
    }
}