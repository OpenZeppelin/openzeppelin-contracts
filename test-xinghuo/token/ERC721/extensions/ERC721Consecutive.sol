pragma solidity ^0.8.20;

import {ERC721Consecutive} from "../../../../openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Consecutive.sol";
import {ERC721} from "../../../../openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

contract MyERC721Consecutive is ERC721Consecutive {

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        _mintConsecutive(msg.sender, 100);
    }

    function MaxBatchSize() public view virtual returns (uint64) {
        return _maxBatchSize();
    }

    //ownerof
}