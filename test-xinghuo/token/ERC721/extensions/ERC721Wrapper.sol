pragma solidity ^0.8.20;

import {ERC721Wrapper} from "../../../../openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Wrapper.sol";
import {ERC721} from "../../../../openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "../../../../openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "../../../../openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";

contract MyERC721 is ERC721 {
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {

    }
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
    //setApprovalForAll depositFor 调用者msgsender为合约，切记
}

contract MyERC721Wrapper is ERC721Wrapper {

    constructor(address token, string memory name_, string memory symbol_) ERC721Wrapper(IERC721(token)) ERC721(name_, symbol_) {

    }

    //underlying

    //depositFor

    //withdrawTo

    function Recover(address account, uint256 tokenId) public returns (uint256) {
        return _recover(account, tokenId);
    }
}