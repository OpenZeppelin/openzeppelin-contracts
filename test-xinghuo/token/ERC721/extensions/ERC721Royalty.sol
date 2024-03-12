pragma solidity ^0.8.20;

import {ERC721Royalty} from "../../../../openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import {ERC721} from "../../../../openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {IERC2981} from "../../../../openzeppelin-contracts/contracts/interfaces/IERC2981.sol";

contract MyERC721Royalty is ERC721Royalty {

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {

    }


    function SupportsInterface() public returns (bool) {
        return supportsInterface(type(IERC2981).interfaceId);
    }

    //其余接口同ERCERC2981相关接口
}